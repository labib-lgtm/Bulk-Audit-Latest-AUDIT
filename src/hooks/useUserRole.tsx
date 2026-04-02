import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if (authLoading) return;

    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Fetch role
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else if (data?.role) {
          setRole(data.role as AppRole);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        if (mountedRef.current) setRole(null);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    fetchRole();

    // Set up realtime - build channel fully before subscribing
    const channelName = `user-role-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_roles',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        if (!mountedRef.current) return;
        if (payload.eventType === 'DELETE') {
          setRole(null);
        } else if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setRole((payload.new as { role: AppRole }).role);
        }
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, authLoading]);

  const hasAccess = role !== null;

  return {
    role,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    hasAccess,
    isLoading: authLoading || isLoading,
  };
};
