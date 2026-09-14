'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange, signIn, signOut, signUp } from '../supabase';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

/**
 * Custom hook for authentication state and operations
 * Usage: const { user, loading, signIn, signOut } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const subscription = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const result = await signUp(email, password);
        if (result.error) {
          return { error: result.error };
        }
        setUser(result.user);
        return { error: null };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const result = await signIn(email, password);
        if (result.error) {
          return { error: result.error };
        }
        setUser(result.user);
        return { error: null };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signOut();
      if (result.error) {
        return { error: result.error };
      }
      setUser(null);
      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
