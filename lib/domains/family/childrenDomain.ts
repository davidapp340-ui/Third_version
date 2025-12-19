import { supabase } from '@/lib/supabase';
import { Child } from '@/types/zoomi';

export interface CreateLinkedChildData {
  familyId: string;
  name: string;
  age: number;
}

export interface CreateIndependentChildData {
  userId: string;
  name: string;
  age: number;
}

export interface ChildResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const childrenDomain = {
  async createLinkedChild(data: CreateLinkedChildData): Promise<ChildResult<Child>> {
    try {
      const { data: child, error } = await supabase
        .from('children')
        .insert({
          family_id: data.familyId,
          name: data.name,
          age: data.age,
          is_independent: false,
          user_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: child };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createIndependentChild(data: CreateIndependentChildData): Promise<ChildResult<Child>> {
    try {
      const { data: child, error } = await supabase
        .from('children')
        .insert({
          user_id: data.userId,
          name: data.name,
          age: data.age,
          is_independent: true,
          family_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: child };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getFamilyChildren(familyId: string): Promise<Child[]> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching children:', error);
      return [];
    }
  },

  async getChild(childId: string): Promise<Child | null> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching child:', error);
      return null;
    }
  },

  async updateChild(childId: string, updates: Partial<Child>): Promise<ChildResult> {
    try {
      const { error } = await supabase
        .from('children')
        .update(updates)
        .eq('id', childId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async deleteChild(childId: string): Promise<ChildResult> {
    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
