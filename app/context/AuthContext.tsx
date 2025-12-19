import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { AuthState, Child, Profile, UserRole } from '@/types/zoomi';
import { Session } from '@supabase/supabase-js';

// מפתח לשמירה בזיכרון המכשיר
const LINKED_CHILD_STORAGE_KEY = 'zoomi_linked_child_id';

// הגדרת הפונקציות שהקונטקסט חושף החוצה
interface AuthContextType extends AuthState {
  signIn: () => void; // הפניה למסך כניסה (לוגיקה ב-UI)
  signOut: () => Promise<void>;
  pairChildDevice: (code: string) => Promise<{ success: boolean; error?: string }>;
  refreshActiveChild: () => Promise<void>; // רענון נתונים (למשל אחרי תרגול)
  setActiveChild: (child: Child | null) => void; // להורה שבוחר ילד
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ניהול ה-State המרכזי
  const [state, setState] = useState<AuthState>({
    session: null,
    userProfile: null,
    activeChild: null,
    isLoading: true,
    isInitialized: false,
  });

  // 1. אתחול המערכת (בטעינה ראשונית)
  useEffect(() => {
    initializeAuth();

    // האזנה לשינויים ב-Supabase Auth (הורה/ילד עצמאי)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // משתמש נכנס - טען פרופיל
        await loadUserProfile(session);
      } else {
        // משתמש יצא - בדוק אם יש ילד מקושר במכשיר
        await checkLinkedChild();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // לוגיקת האתחול
  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await loadUserProfile(session);
      } else {
        await checkLinkedChild();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
    }
  };

  // טעינת פרופיל משתמש רשום (הורה/ילד עצמאי)
  const loadUserProfile = async (session: Session) => {
    try {
      // 1. הבאת הפרופיל
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) throw new Error('Profile not found');

      let activeChild = null;

      // 2. אם זה ילד עצמאי - נטען אוטומטית את הילד שלו
      if (profile.role === 'child_independent') {
        const { data: childData } = await supabase
          .from('children')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        activeChild = childData;
      }

      setState(prev => ({
        ...prev,
        session,
        userProfile: profile as Profile,
        activeChild: activeChild, // להורה זה נשאר null עד שיבחר
        isLoading: false
      }));

    } catch (error) {
      console.error('Error loading profile:', error);
      // במקרה של שגיאה קריטית, ננתק
      await supabase.auth.signOut();
    }
  };

  // בדיקת ילד מקושר (ללא סשן)
  const checkLinkedChild = async () => {
    try {
      const storedChildId = await AsyncStorage.getItem(LINKED_CHILD_STORAGE_KEY);
      
      if (storedChildId) {
        // קריאה לפונקציית ה-RPC המאובטחת שיצרנו בשלב 2
        const { data: childData, error } = await supabase.rpc('get_linked_child', {
          child_uuid: storedChildId
        });

        if (childData && !error) {
          setState(prev => ({
            ...prev,
            session: null,
            userProfile: null,
            activeChild: { ...childData, is_linked_device: true } as Child,
            isLoading: false
          }));
          return;
        }
      }

      // אם הגענו לפה - אין אף אחד מחובר
      setState(prev => ({
        ...prev,
        session: null,
        userProfile: null,
        activeChild: null,
        isLoading: false
      }));

    } catch (error) {
      console.error('Error checking linked child:', error);
    }
  };

  // === פעולות ===

  // צימוד מכשיר חדש
  const pairChildDevice = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // קריאה ל-RPC לאימות הקוד
      const { data, error } = await supabase.rpc('verify_linking_code', {
        code_input: code
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Invalid code');

      // שמירה במכשיר
      const child = data.child;
      await AsyncStorage.setItem(LINKED_CHILD_STORAGE_KEY, child.id);

      // עדכון ה-State
      setState(prev => ({
        ...prev,
        session: null,
        userProfile: null,
        activeChild: { ...child, is_linked_device: true },
        isLoading: false
      }));

      return { success: true };

    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: err.message || 'Connection failed' };
    }
  };

  // יציאה
  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // 1. יציאה מ-Supabase (אם מחובר)
      await supabase.auth.signOut();
      // 2. מחיקת קישור ילד (אם קיים)
      await AsyncStorage.removeItem(LINKED_CHILD_STORAGE_KEY);
      
      // איפוס State
      setState({
        session: null,
        userProfile: null,
        activeChild: null,
        isLoading: false,
        isInitialized: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // רענון נתוני הילד הפעיל (למשל אחרי שסיים תרגיל)
  const refreshActiveChild = async () => {
    const { activeChild, session } = state;
    if (!activeChild) return;

    try {
      // אם זה ילד מקושר
      if (!session && activeChild.is_linked_device) {
        const { data } = await supabase.rpc('get_linked_child', {
          child_uuid: activeChild.id
        });
        if (data) {
          setState(prev => ({ ...prev, activeChild: { ...data, is_linked_device: true } }));
        }
      } 
      // אם זה הורה/ילד עצמאי - שליפה רגילה
      else {
        const { data } = await supabase
          .from('children')
          .select('*')
          .eq('id', activeChild.id)
          .single();
          
        if (data) {
          setState(prev => ({ ...prev, activeChild: data }));
        }
      }
    } catch (error) {
      console.error('Failed to refresh child:', error);
    }
  };

  // פונקציית עזר להורה לבחור באיזה ילד לצפות
  const setActiveChild = (child: Child | null) => {
    setState(prev => ({ ...prev, activeChild: child }));
  };

  const signIn = () => {
    // פונקציית דמי, הניווט יתבצע ב-UI
    console.log('Use Supabase signInWithPassword in your login screen');
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signOut,
      pairChildDevice,
      refreshActiveChild,
      setActiveChild
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook לשימוש קל בקומפוננטות
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};