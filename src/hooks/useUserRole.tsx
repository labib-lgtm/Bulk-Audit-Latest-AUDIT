import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch role and set up realtime listener
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

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
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up realtime listener for access revocation
    const setupRealtimeListener = () => {
      if (!user) return;

      // Clean up any existing channel first
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`user-role-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              console.log('Access revoked - role deleted');
              setRole(null);
            } else if (payload.eventType === 'UPDATE') {
              console.log('Role updated:', payload.new);
              setRole((payload.new as { role: AppRole }).role);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    if (!authLoading) {
      fetchRole();
      setupRealtimeListener();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, authLoading]);

  const hasAccess = role !== null;
  
  return {
    role,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    hasAccess,
    isLoading: authLoading || isLoading,
  };
};
