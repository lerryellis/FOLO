'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // If on login/signup, redirect to dashboard
          if (pathname === '/login' || pathname === '/signup') {
            router.push('/dashboard');
          }
        } else {
          // If not authenticated and on protected pages, redirect to login
          if (pathname?.startsWith('/dashboard')) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8EAED] border-t-[#10B981]" />
          <p className="text-sm text-[#64748b]">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
