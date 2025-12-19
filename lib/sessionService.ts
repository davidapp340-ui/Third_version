import { supabase } from './supabase';

const SESSION_KEY = 'zoomi_child_session';
const SESSION_EXPIRY_DAYS = 30;

interface ChildSession {
  childId: string;
  userId: string;
  linkedAt: string;
  expiresAt: string;
}

export async function saveChildSession(childId: string, userId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const session: ChildSession = {
    childId,
    userId,
    linkedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export async function getChildSession(): Promise<ChildSession | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const sessionJson = localStorage.getItem(SESSION_KEY);

  if (!sessionJson) {
    return null;
  }

  const session: ChildSession = JSON.parse(sessionJson);
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);

  if (now > expiresAt) {
    await clearChildSession();
    return null;
  }

  return session;
}

export async function clearChildSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function checkAndRestoreSession(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const userType = user.user_metadata?.user_type;

    if (userType === 'parent' || userType === 'child_independent') {
      return true;
    }

    if (userType === 'child') {
      const session = await getChildSession();
      if (session && session.userId === user.id) {
        return true;
      }
    }
  }

  const session = await getChildSession();

  if (!session) {
    return false;
  }

  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', session.childId)
    .maybeSingle();

  if (!child || !child.user_id) {
    await clearChildSession();
    return false;
  }

  const email = `child_${child.id}@zoomi.local`;
  const password = `zoomi_child_${child.id}`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await clearChildSession();
    return false;
  }

  return true;
}
