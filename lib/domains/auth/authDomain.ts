import { supabase } from '@/lib/supabase';
import { Profile, Child } from '@/types/zoomi';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'parent' | 'child_independent';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const authDomain = {
  async signUp(data: SignUpData): Promise<AuthResult<{ userId: string }>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
      });

      if (profileError) throw profileError;

      return { success: true, data: { userId: authData.user.id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async getChildForIndependentUser(userId: string): Promise<Child | null> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .eq('is_independent', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching independent child:', error);
      return null;
    }
  },
};
