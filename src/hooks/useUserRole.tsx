import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'user';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const useUserRole = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching user role:', error);
        setRole(null);
      } else if (data?.role) {
        setRole(data.role as AppRole);
      } else {
        setRole(null);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching user role:', err);
      if (mountedRef.current) setRole(null);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (authLoading) return;

    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchRole(user.id);

    // Poll every 30s instead of realtime subscription
    const interval = setInterval(() => {
      if (mountedRef.current) fetchRole(user.id);
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [user?.id, authLoading, fetchRole]);

  const hasAccess = role !== null;

  return {
    role,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    hasAccess,
    isLoading: authLoading || isLoading,
  };
};
