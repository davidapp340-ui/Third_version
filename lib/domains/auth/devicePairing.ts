import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types/zoomi';

const LINKED_CHILD_STORAGE_KEY = 'zoomi_linked_child_id';

export interface PairingResult {
  success: boolean;
  child?: Child;
  error?: string;
}

export const devicePairing = {
  async pairDevice(code: string): Promise<PairingResult> {
    try {
      const { data, error } = await supabase.rpc('verify_linking_code', {
        code_input: code.toUpperCase(),
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Invalid code');

      const child = data.child as Child;
      await AsyncStorage.setItem(LINKED_CHILD_STORAGE_KEY, child.id);

      return { success: true, child: { ...child, is_linked_device: true } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Pairing failed' };
    }
  },

  async getLinkedChild(): Promise<Child | null> {
    try {
      const storedChildId = await AsyncStorage.getItem(LINKED_CHILD_STORAGE_KEY);
      if (!storedChildId) return null;

      const { data, error } = await supabase.rpc('get_linked_child', {
        child_uuid: storedChildId,
      });

      if (error || !data) return null;

      return { ...data, is_linked_device: true } as Child;
    } catch (error) {
      console.error('Error getting linked child:', error);
      return null;
    }
  },

  async unlinkDevice(): Promise<void> {
    await AsyncStorage.removeItem(LINKED_CHILD_STORAGE_KEY);
  },

  async generateLinkingCode(childId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('generate_linking_code', {
        child_uuid: childId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating linking code:', error);
      return null;
    }
  },
};
