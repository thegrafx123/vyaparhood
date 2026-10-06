import { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api';
import { Me } from '../api/types';
import { setSentryUser } from '../lib/sentry';
import { supabase } from '../lib/supabase';

type AuthValue = {
  /** False until the saved session has been read from the phone. */
  ready: boolean;
  session: Session | null;
  userId: string | null;
  /** E.164 digits from Supabase, e.g. "919876543210". */
  phone: string | null;
  me: Me | null;
  meLoading: boolean;
  refreshMe: () => Promise<Me | null>;
};

const AuthContext = createContext<AuthValue | null>(null);

export const meKey = (uid: string | null) => ['me', uid] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_OUT') qc.clear();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    setSentryUser(userId);
  }, [userId]);

  const meQuery = useQuery({
    queryKey: meKey(userId),
    queryFn: api.me.fetch,
    enabled: !!userId,
  });

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session,
      userId,
      phone: session?.user.phone ?? null,
      me: meQuery.data ?? null,
      meLoading: !!userId && meQuery.isLoading,
      // Reads the session straight from Supabase: right after an OTP is
      // verified, the `session` state above hasn't caught up yet.
      refreshMe: async () => {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user.id ?? null;
        return uid ? qc.fetchQuery({ queryKey: meKey(uid), queryFn: api.me.fetch, staleTime: 0 }) : null;
      },
    }),
    [ready, session, userId, meQuery.data, meQuery.isLoading, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
