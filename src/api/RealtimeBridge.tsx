import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthProvider';
import { addMessageToCache, keys } from './hooks';
import { Message } from './types';

/**
 * One live connection per signed-in user. The database only sends rows
 * this user is allowed to see (row-level security), and we refresh the
 * matching cached screens.
 */
export function RealtimeBridge() {
  const qc = useQueryClient();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;
    // A fresh name every time: Supabase hands back any existing channel with
    // the same name, and one left over from before a logout is already
    // subscribed, so adding listeners to it throws.
    const channel = supabase
      .channel(`user-${userId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        addMessageToCache(qc, payload.new as Message);
        qc.invalidateQueries({ queryKey: keys.chats });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connection_requests' }, () => {
        qc.invalidateQueries({ queryKey: keys.requests });
        qc.invalidateQueries({ queryKey: keys.chats });
        qc.invalidateQueries({ queryKey: ['member'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: keys.notifications });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return null;
}
