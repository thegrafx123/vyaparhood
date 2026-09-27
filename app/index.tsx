import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as api from '../src/api';
import { LogoMark } from '../src/components/Layout';
import { reportError } from '../src/lib/sentry';
import { routeForMe } from '../src/lib/routing';
import { supabase } from '../src/lib/supabase';
import { syncLocation } from '../src/lib/syncLocation';
import { resolveLocation } from '../src/services/location';
import { LocationState, useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';

/**
 * 01 · Launch. Takes one foreground location reading, then:
 *  - signed out → welcome (or manual address if location is off)
 *  - signed in  → saves location to Supabase and resumes where they left off
 */
export default function LocationGate() {
  const router = useRouter();
  const { actions } = useApp();
  const { ready, refreshMe } = useAuth();

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 500));
      const result = await resolveLocation();
      if (cancelled) return;

      const loc: Partial<LocationState> =
        result.status === 'granted'
          ? {
              status: 'granted',
              source: 'device',
              coords: result.coords,
              geohash: result.geohash,
              detectedCity: result.city,
              detectedArea: result.area,
            }
          : { status: result.status, canAskAgain: result.status === 'denied' ? result.canAskAgain : true };
      actions.setLocation(loc);

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace(result.status === 'granted' ? '/welcome' : '/manual-address');
        return;
      }

      try {
        const me = await refreshMe();
        if (result.status === 'granted') {
          await syncLocation({ ...(loc as LocationState), manualAddress: null });
        } else if (!me?.location) {
          // Signed in, location off, and no address on file yet.
          router.replace('/manual-address');
          return;
        }
        if (!cancelled) router.replace(routeForMe(me) as never);
      } catch (e) {
        reportError(e, { where: 'launch' });
        await api.auth.signOut();
        if (!cancelled) router.replace('/welcome');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <LogoMark size={s(72)} faded />
        <Text style={styles.name}>Vyaparhood</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.splash, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', opacity: 0.18 },
  name: { fontFamily: fonts.display, fontSize: s(24), color: colors.white, marginTop: s(10) },
});
