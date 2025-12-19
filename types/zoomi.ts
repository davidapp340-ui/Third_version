import { Session } from '@supabase/supabase-js';

export type UserRole = 'parent' | 'child_independent';

export interface Family {
  id: string;
  parent_user_id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  family_id: string | null;
  user_id: string | null;
  name: string;
  age?: number;
  avatar_url?: string;
  is_independent: boolean;
  linking_code?: string;
  linking_code_expires_at?: string;
  current_streak: number;
  total_minutes_practiced: number;
  created_at: string;
  updated_at: string;
  is_linked_device?: boolean;
}

export interface AuthState {
  session: Session | null;
  userProfile: Profile | null;
  activeChild: Child | null;
  isLoading: boolean;
  isInitialized: boolean;
}