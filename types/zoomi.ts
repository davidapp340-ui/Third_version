export type UserRole = 'parent' | 'child_independent';

export interface Family {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  family_id: string;
  role: UserRole;
  email: string;
  first_name: string;
}

export interface Child {
  id: string;
  family_id: string;
  user_id: string | null; // null for linked child
  name: string;
  avatar_url?: string;
}

// מצב האפליקציה הגלובלי
export interface AuthState {
  isAuthenticated: boolean;
  userType: 'parent' | 'child_linked' | 'child_independent' | null;
  parentProfile: Profile | null; // קיים רק אם זה הורה
  activeChild: Child | null; // קיים תמיד כשמחוברים (גם להורה כשהוא בוחר ילד, וגם לילד)
  loading: boolean;
}