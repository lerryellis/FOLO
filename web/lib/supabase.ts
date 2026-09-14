import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn('Auth error:', error.message);
      return null;
    }
    return user || null;
  } catch (error) {
    console.warn('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed';
    return { user: null, session: null, error: message };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    return { user: null, session: null, error: message };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign out failed';
    return { error: message };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    return { error: message };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return { error: message };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      callback(session.user);
    } else {
      callback(null);
    }
  });

  return subscription;
}
