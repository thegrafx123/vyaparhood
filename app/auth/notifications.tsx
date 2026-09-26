import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogoMark, Screen } from '../../src/components/Layout';
import { requestNotificationPermission } from '../../src/services/notifications';
import { useApp } from '../../src/state/AppStore';
import { colors, fonts, H_PAD, s } from '../../src/theme/tokens';

/**
 * 14 · Notification permission. The dialog is drawn by the OS; this
 * screen is the dimmed app skeleton behind it, as in the design.
 */
export default function NotificationsPermission() {
  const router = useRouter();
  const { actions } = useApp();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 500));
      const allowed = await requestNotificationPermission();
      if (cancelled) return;
      actions.patch({ notificationsAllowed: allowed });
      actions.setSettings({ notifyRequests: allowed, notifyMessages: allowed });
      router.replace('/paywall');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen statusBar="light">
      <View style={styles.header}>
        <LogoMark size={s(38)} />
        <Text style={styles.brand}>Vyaparhood</Text>
      </View>
      <View style={[styles.bar, { width: '72%', marginTop: s(34) }]} />
      <View style={styles.block} />
      <View style={styles.dim} pointerEvents="none" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD, paddingTop: s(18) },
  brand: { fontFamily: fonts.display, fontSize: s(19), color: colors.ink, marginLeft: s(10), marginTop: s(3) },
  bar: { height: s(14), borderRadius: s(7), backgroundColor: colors.divider, marginHorizontal: H_PAD },
  block: { height: s(84), borderRadius: s(24), backgroundColor: colors.divider, margin: H_PAD, marginTop: s(10) },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 38, 60, 0.46)' },
});
