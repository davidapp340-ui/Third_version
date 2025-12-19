import { supabase } from './supabase';

export interface Child {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  age: number;
  avatar_url: string | null;
  linking_code: string;
  is_linked: boolean;
  linked_at: string | null;
  current_step: number;
  total_steps: number;
  consecutive_days: number;
  last_practice_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  parent_id: string;
  name: string;
  created_at: string;
}

export interface Parent {
  id: string;
  first_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AddChildData {
  name: string;
  age: number;
}

export async function createParentProfile(userId: string, firstName: string, email: string) {
  const { data: parent, error: parentError } = await supabase
    .from('parents')
    .insert({
      id: userId,
      first_name: firstName,
      email,
    })
    .select()
    .single();

  if (parentError) throw parentError;

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({
      parent_id: userId,
      name: 'My Family',
    })
    .select()
    .single();

  if (familyError) throw familyError;

  return { parent, family };
}

export async function getParentProfile(userId: string) {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getFamily(parentId: string) {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('parent_id', parentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getChildren(familyId: string) {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Child[];
}

export async function addChild(familyId: string, childData: AddChildData) {
  const { data: childRecord, error: childError } = await supabase
    .from('children')
    .insert({
      family_id: familyId,
      name: childData.name,
      age: childData.age,
    })
    .select()
    .single();

  if (childError) throw childError;

  const child = childRecord as Child;

  console.log('[addChild] Creating auth account for child:', child.id);

  const { data, error: functionError } = await supabase.functions.invoke('create-child-account', {
    body: {
      childId: child.id,
      name: child.name,
      age: child.age,
      familyId: child.family_id,
    },
  });

  if (functionError) {
    console.error('[addChild] Edge function error:', functionError);
    throw new Error('שגיאה ביצירת חשבון הילד: ' + functionError.message);
  }

  if (data?.error) {
    console.error('[addChild] Failed to create auth account:', data.error);
    throw new Error('שגיאה ביצירת חשבון הילד: ' + data.error);
  }

  if (!data?.success) {
    console.error('[addChild] Account creation returned no success:', data);
    throw new Error('שגיאה ביצירת חשבון הילד');
  }

  console.log('[addChild] Auth account created successfully:', data.userId);

  return child;
}

async function generateUniqueLinkingCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data } = await supabase
      .from('children')
      .select('id')
      .eq('linking_code', code)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    }
  }

  return code;
}

export async function getResearchMessages() {
  const { data, error } = await supabase
    .from('research_messages')
    .select('message_key')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateChildProgress(childId: string, updates: Partial<Child>) {
  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)
    .select()
    .single();

  if (error) throw error;
  return data as Child;
}

export async function deleteChild(childId: string) {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId);

  if (error) throw error;
}

export async function recordParentConsent(
  parentId: string,
  childId: string,
  policyIds: string[]
) {
  const consents = policyIds.map(policyId => ({
    parent_id: parentId,
    child_id: childId,
    policy_id: policyId,
    policy_version: 1,
  }));

  const { error } = await supabase
    .from('parent_consents')
    .insert(consents);

  if (error) throw error;
}

export async function getConsentPolicies() {
  const { data, error } = await supabase
    .from('consent_policies')
    .select('*')
    .eq('is_active', true)
    .order('policy_type', { ascending: true });

  if (error) throw error;
  return data;
}

export async function linkChildWithCode(linkingCode: string) {
  console.log('[linkChildWithCode] Starting with code:', linkingCode);

  const { data: child, error: childError } = await supabase
    .from('children')
    .select('*')
    .eq('linking_code', linkingCode)
    .eq('code_generated_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  console.log('[linkChildWithCode] Query result:', { child, childError });

  if (childError) {
    console.error('[linkChildWithCode] Database error:', childError);
    throw childError;
  }

  if (!child) {
    console.error('[linkChildWithCode] No child found with code:', linkingCode);
    throw new Error('קוד לא תקין או פג תוקף');
  }

  if (!child.user_id) {
    console.error('[linkChildWithCode] Child account not created yet:', child.name);
    throw new Error('חשבון הילד טרם נוצר. אנא צור קשר עם ההורה.');
  }

  console.log('[linkChildWithCode] Found child:', child.name, 'with user_id:', child.user_id);

  const email = `child_${child.id}@zoomi.local`;
  const password = `zoomi_child_${child.id}`;

  console.log('[linkChildWithCode] Signing in to existing account');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData?.user) {
    console.error('[linkChildWithCode] Sign in failed:', signInError?.message);
    throw new Error('לא ניתן להתחבר. אנא בדוק את הקוד או צור קשר עם ההורה.');
  }

  console.log('[linkChildWithCode] Sign in successful');

  const { saveChildSession } = await import('./sessionService');
  await saveChildSession(child.id, signInData.user.id);

  console.log('[linkChildWithCode] Login complete');
  return { ...child, isFirstLogin: false };
}

export async function getChildByUserId(userId: string) {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createIndependentChildRecord(userId: string, name: string, age: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let linkingCode = '';
  for (let i = 0; i < 6; i++) {
    linkingCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const { data, error } = await supabase
    .from('children')
    .insert({
      user_id: userId,
      name,
      age,
      linking_code: linkingCode,
      is_independent: true,
      is_linked: true,
      linked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Child;
}

export async function getChildAccessCode(childId: string) {
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('linking_code, name, code_generated_date')
    .eq('id', childId)
    .single();

  if (childError) throw childError;

  if (!child) {
    throw new Error('ילד לא נמצא');
  }

  const today = new Date().toISOString().split('T')[0];

  if (child.code_generated_date !== today) {
    const { data: updateResult, error: updateError } = await supabase
      .from('children')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', childId)
      .select('linking_code, name, code_generated_date')
      .single();

    if (updateError) throw updateError;

    return { name: updateResult.name, code: updateResult.linking_code };
  }

  return { name: child.name, code: child.linking_code };
}

export async function softDeleteParentAccount(parentId: string) {
  const { data, error } = await supabase.rpc('soft_delete_parent_account', {
    parent_id: parentId,
  });

  if (error) throw error;
  return data;
}

export async function restoreParentAccount(parentId: string) {
  const { data, error } = await supabase.rpc('restore_parent_account', {
    parent_id: parentId,
  });

  if (error) throw error;
  return data;
}

export async function checkAccountDeletionStatus(parentId: string) {
  const { data, error } = await supabase.rpc('check_account_deletion_status', {
    parent_id: parentId,
  });

  if (error) throw error;
  return data;
}
