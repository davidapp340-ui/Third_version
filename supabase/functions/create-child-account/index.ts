import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateChildAccountRequest {
  childId: string;
  name: string;
  age: number;
  familyId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { childId, name, age, familyId }: CreateChildAccountRequest = await req.json();

    console.log('[create-child-account] Creating account for:', { childId, name, age });

    if (!childId || !name || !age || !familyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const email = `child_${childId}@zoomi.local`;
    const password = `zoomi_child_${childId}`;

    console.log('[create-child-account] Creating auth user with email:', email);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: name,
        age: age,
        user_type: 'child',
        child_id: childId,
        family_id: familyId,
      },
    });

    if (authError) {
      console.error('[create-child-account] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-child-account] Auth user created:', authData.user.id);

    const { error: updateError } = await supabase
      .from('children')
      .update({
        user_id: authData.user.id,
        is_linked: true,
        linked_at: new Date().toISOString(),
      })
      .eq('id', childId);

    if (updateError) {
      console.error('[create-child-account] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-child-account] Child record updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        userId: authData.user.id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[create-child-account] Function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});