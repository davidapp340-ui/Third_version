import { Session } from '@supabase/supabase-js';

// סוגי משתמשים במערכת (רק מי שיש לו יוזר ב-Supabase)
export type UserRole = 'parent' | 'child_independent';

// מבנה משפחה
export interface Family {
  id: string;
  name: string;
  created_at?: string;
}

// פרופיל משתמש רשום (הורה או ילד עצמאי)
export interface Profile {
  id: string; // תואם ל-auth.users.id
  family_id: string | null; // יכול להיות ריק בהתחלה לילד עצמאי
  role: UserRole;
  email: string;
  first_name?: string;
  created_at?: string;
}

// אובייקט ילד (השחקן)
export interface Child {
  id: string;
  family_id: string;
  user_id: string | null; // null עבור ילד מקושר, מלא עבור ילד עצמאי
  name: string;
  avatar_url?: string;
  
  // נתוני התקדמות בסיסיים
  current_step: number;
  total_steps: number;
  
  // דגלים לשימוש ב-UI (אופציונליים)
  is_linked_device?: boolean; // טרו אם זה מכשיר שצומד בקוד
}

// מצב האימות הגלובלי (State)
// זה מה שה-AuthContext יחשוף לכל האפליקציה
export interface AuthState {
  // 1. משתמשים רשומים
  session: Session | null; // הסשן הטכני של Supabase
  userProfile: Profile | null; // הנתונים העסקיים (מי זה?)

  // 2. ילד פעיל (הרלוונטי ביותר למשחק)
  // עבור הורה: הילד שהוא בחר לצפות בו (או null)
  // עבור ילד עצמאי: הוא עצמו
  // עבור ילד מקושר: הילד שצומד למכשיר
  activeChild: Child | null;

  // 3. סטטוס מערכת
  isLoading: boolean;
  isInitialized: boolean; // האם סיימנו לבדוק הכל בטעינה?
}