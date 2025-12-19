import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthState, Child, Profile } from '@/types/zoomi';
import { authDomain, devicePairing, childrenDomain } from '@/lib/domains';
import { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  pairChildDevice: (code: string) => Promise<{ success: boolean; error?: string }>;
  refreshActiveChild: () => Promise<void>;
  setActiveChild: (child: Child | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    userProfile: null,
    activeChild: null,
    isLoading: true,
    isInitialized: false,
  });

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) {
          await loadUserProfile(session);
        } else {
          await checkLinkedChild();
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const loadUserProfile = async (session: Session) => {
    try {
      const profile = await authDomain.getProfile(session.user.id);
      if (!profile) throw new Error('Profile not found');

      let activeChild = null;

      if (profile.role === 'child_independent') {
        activeChild = await authDomain.getChildForIndependentUser(session.user.id);
      }

      setState(prev => ({
        ...prev,
        session,
        userProfile: profile,
        activeChild,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
      await supabase.auth.signOut();
    }
  };

  const checkLinkedChild = async () => {
    try {
      const linkedChild = await devicePairing.getLinkedChild();

      setState(prev => ({
        ...prev,
        session: null,
        userProfile: null,
        activeChild: linkedChild,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error checking linked child:', error);
    }
  };

  const pairChildDevice = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    const result = await devicePairing.pairDevice(code);

    if (result.success && result.child) {
      setState(prev => ({
        ...prev,
        session: null,
        userProfile: null,
        activeChild: result.child!,
        isLoading: false,
      }));
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }

    return result;
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authDomain.signOut();
      await devicePairing.unlinkDevice();

      setState({
        session: null,
        userProfile: null,
        activeChild: null,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshActiveChild = async () => {
    const { activeChild, session } = state;
    if (!activeChild) return;

    try {
      let updatedChild: Child | null = null;

      if (!session && activeChild.is_linked_device) {
        updatedChild = await devicePairing.getLinkedChild();
      } else {
        updatedChild = await childrenDomain.getChild(activeChild.id);
      }

      if (updatedChild) {
        setState(prev => ({
          ...prev,
          activeChild: activeChild.is_linked_device
            ? { ...updatedChild!, is_linked_device: true }
            : updatedChild
        }));
      }
    } catch (error) {
      console.error('Failed to refresh child:', error);
    }
  };

  const setActiveChild = (child: Child | null) => {
    setState(prev => ({ ...prev, activeChild: child }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        pairChildDevice,
        refreshActiveChild,
        setActiveChild,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};