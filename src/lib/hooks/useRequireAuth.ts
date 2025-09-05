'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

/**
 * Hook that redirects to admin login if user is not authenticated
 * Replaces the repeated checkAuth pattern in admin pages
 */
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin');
      }
    };

    checkAuth();
  }, [router]);
}
