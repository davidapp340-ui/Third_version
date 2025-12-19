import { supabase } from '@/lib/supabase';
import { Family } from '@/types/zoomi';

export interface CreateFamilyData {
  parentUserId: string;
  name?: string;
}

export interface FamilyResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const familyDomain = {
  async createFamily(data: CreateFamilyData): Promise<FamilyResult<Family>> {
    try {
      const { data: family, error } = await supabase
        .from('families')
        .insert({
          parent_user_id: data.parentUserId,
          name: data.name || 'המשפחה שלי',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: family };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getFamilyByParent(parentUserId: string): Promise<Family | null> {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('parent_user_id', parentUserId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching family:', error);
      return null;
    }
  },

  async updateFamily(familyId: string, name: string): Promise<FamilyResult> {
    try {
      const { error } = await supabase
        .from('families')
        .update({ name })
        .eq('id', familyId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
