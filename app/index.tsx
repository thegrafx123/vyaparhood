import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import * as api from '../src/api';
import { refreshLiveLocation } from '../src/lib/liveLocation';
import { routeForMe } from '../src/lib/routing';
import { reportError } from '../src/lib/sentry';
import { Pulse } from '../src/motion';
import { getPermission } from '../src/services/location';
import { useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';
import { PillButton, TextButton } from '../src/ui/Buttons';
import { LogoMark } from '../src/ui/Header';
import { Screen } from '../src/ui/Screen';

/** Auth errors mean the saved login is no longer valid; anything else is treated as "offline". */
const isAuthError = (e: unknown) => {
  const err = e as { status?: number; code?: string; message?: string } | null;
  return err?.status === 401 || err?.status === 403 || /jwt|refresh token|not signed in/i.test(err?.message ?? '');
};

/**
 * Launch. Signed out → the generic splash (slide 2).
 * Signed in → refresh live location (if already allowed) and resume where
 * they left off.
 */
export default function Launch() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { ready, session, refreshMe } = useAuth();
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready || !state.flagsReady) return;
    let cancelled = false;
    (async () => {
      const permission = await getPermission();
      if (permission.status === 'denied') actions.setLive({ status: 'denied' });

      if (!session) {
        if (permission.status === 'granted') {
          refreshLiveLocation({ signedIn: false, onFix: actions.setLive });
        }
        if (!cancelled) router.replace('/welcome');
        return;
      }

      try {
        if (permission.status === 'granted') {
          // Don't hold the launch for GPS; Discover refreshes when it arrives.
          refreshLiveLocation({ signedIn: true, onFix: actions.setLive });
        }
        const me = await refreshMe();
        if (!cancelled) router.replace(routeForMe(me, state.flags) as never);
      } catch (e) {
        reportError(e, { where: 'launch' });
        if (isAuthError(e)) {
          await api.auth.signOut();
          if (!cancelled) router.replace('/welcome');
        } else if (!cancelled) {
          setOffline(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.flagsReady, attempt]);

  return (
    <Screen bg={colors.splash} statusBar="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(40) }}>
        <Pulse>
          <LogoMark size={s(68)} border={s(3)} borderColor={colors.lime} />
        </Pulse>
        <Text style={{ fontFamily: fonts.display, fontSize: s(17), color: colors.white, marginTop: s(14), letterSpacing: 0.3 }}>
          Vyaparhood
        </Text>
        {offline && (
          <View style={{ alignItems: 'center', marginTop: s(28), gap: s(14) }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: s(13), color: colors.navyText, textAlign: 'center' }}>
              Couldn't connect. Check your internet and try again.
            </Text>
            <PillButton
              label="Try again"
              tone="lime"
              onPress={() => {
                setOffline(false);
                setAttempt((n) => n + 1);
              }}
            />
            <TextButton
              label="Log out"
              color={colors.navyText}
              onPress={async () => {
                await api.auth.signOut();
                router.replace('/welcome');
              }}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
