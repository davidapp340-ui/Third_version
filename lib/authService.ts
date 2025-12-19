import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { AuthState, Child, Profile } from '@/types/zoomi';

const CHILD_STORAGE_KEY = 'zoomi_linked_child_id';

// פונקציה ראשית לבדיקת מצב הכניסה (לפי האפיון)
export async function checkAuthState(): Promise<AuthState> {
  try {
    // 1. בדיקת הורה/ילד עצמאי (Supabase Session)
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // יש משתמש רשום - נמשוך את הפרופיל
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        // מקרה מיוחד: ילד עצמאי
        if (profile.role === 'child_independent') {
          const { data: childRec } = await supabase
            .from('children')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          return {
            isAuthenticated: true,
            userType: 'child_independent',
            parentProfile: null,
            activeChild: childRec,
            loading: false
          };
        }

        // הורה
        return {
          isAuthenticated: true,
          userType: 'parent',
          parentProfile: profile,
          activeChild: null, // הורה יבחר ילד בהמשך
          loading: false
        };
      }
    }

    // 2. בדיקת ילד מקושר (AsyncStorage) - רק אם אין הורה
    const linkedChildId = await AsyncStorage.getItem(CHILD_STORAGE_KEY);
    
    if (linkedChildId) {
      const { data: child, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', linkedChildId)
        .single();

      if (child && !error) {
        return {
          isAuthenticated: true,
          userType: 'child_linked',
          parentProfile: null,
          activeChild: child,
          loading: false
        };
      }
    }

    // לא מחובר
    return {
      isAuthenticated: false,
      userType: null,
      parentProfile: null,
      activeChild: null,
      loading: false
    };

  } catch (error) {
    console.error('Auth check failed:', error);
    return { isAuthenticated: false, userType: null, parentProfile: null, activeChild: null, loading: false };
  }
}

// === פעולות ===

// כניסת ילד עם קוד (Pairing)
export async function pairDeviceWithCode(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('verify_child_linking_code', {
      code_input: code
    });

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };

    // שמירה מקומית במכשיר
    const child = data.child;
    await AsyncStorage.setItem(CHILD_STORAGE_KEY, child.id);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: 'שגיאת תקשורת' };
  }
}

// יציאה
export async function logout() {
  // בדיקה אם זה הורה או ילד מקושר
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await supabase.auth.signOut();
  } else {
    // ניתוק ילד מקושר
    await AsyncStorage.removeItem(CHILD_STORAGE_KEY);
  }
}

// יצירת קוד לילד (ע"י הורה)
export async function generateCodeForChild(childId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('generate_linking_code', {
    child_uuid: childId
  });
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}