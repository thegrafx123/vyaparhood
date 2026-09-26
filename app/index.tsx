import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogoMark } from '../src/components/Layout';
import { resolveLocation } from '../src/services/location';
import { useApp } from '../src/state/AppStore';
import { colors, fonts, s } from '../src/theme/tokens';

/**
 * 01 · Location permission.
 * The dialog itself is drawn by iOS/Android; its text on iOS comes from
 * NSLocationWhenInUseUsageDescription in app.json. Android shows its own
 * standard wording.
 */
export default function LocationGate() {
  const router = useRouter();
  const { actions } = useApp();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 600));
      const result = await resolveLocation();
      if (cancelled) return;

      if (result.status === 'granted') {
        actions.setLocation({
          status: 'granted',
          source: 'device',
          coords: result.coords,
          geohash: result.geohash,
          detectedCity: result.city,
        });
        router.replace('/welcome');
      } else {
        actions.setLocation({
          status: result.status,
          canAskAgain: result.status === 'denied' ? result.canAskAgain : true,
        });
        router.replace('/manual-address');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
