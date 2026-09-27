import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../src/api';
import { friendlyError } from '../src/api/errors';
import { useBlocked, useUnblock } from '../src/api/hooks';
import { isActiveMember, ProfileUpdate } from '../src/api/types';
import { Toggle } from '../src/components/Controls';
import { ChevronRight } from '../src/components/icons';
import { Divider, HeaderRow, Screen, SoftCard } from '../src/components/Layout';
import { env } from '../src/lib/env';
import { reportError } from '../src/lib/sentry';
import { payments } from '../src/services/payments';
import { useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s, TAB_PAD } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { formatPhone } from '../src/utils/validation';

/** 30 · Settings. Toggles are saved to your Supabase profile. */
export default function SettingsScreen() {
  const router = useRouter();
  const { actions } = useApp();
  const { me, email, refreshMe } = useAuth();
  const { data: blocked = [] } = useBlocked();
  const unblock = useUnblock();
  const [busy, setBusy] = useState(false);
  const p = me?.profile;
  if (!p) return null;
  const active = isActiveMember(me);

  const verification =
    p.verification_status === 'verified'
      ? { text: 'Verified ✓', color: colors.teal }
      : p.verification_status === 'pending'
        ? { text: 'Under review', color: colors.yellow }
        : p.verification_status === 'rejected'
          ? { text: 'Not approved', color: colors.danger }
          : { text: 'Not submitted', color: colors.textMuted };

  const setPref = async (patch: ProfileUpdate) => {
    try {
      await api.me.update(patch);
      await refreshMe();
    } catch (e) {
      Alert.alert("Couldn't save", friendlyError(e));
    }
  };

  const manageMembership = () => {
    const url = payments.manageUrl();
    if (url) Linking.openURL(url);
    else
      Alert.alert(
        'Membership',
        me?.membership?.source === 'admin'
          ? 'Your membership was activated by the Vyaparhood team.'
          : 'Managing or cancelling your membership will open here once payments go live.',
      );
  };

  const showBlocked = () => {
    if (!blocked.length) return Alert.alert('Blocked members', "You haven't blocked anyone.");
    Alert.alert('Blocked members', 'Tap a name to unblock them.', [
      ...blocked.slice(0, 6).map((b) => ({ text: `Unblock ${b.full_name}`, onPress: () => unblock.mutate(b.id) })),
      { text: 'Close', style: 'cancel' as const },
    ]);
  };

  const leave = () => {
    actions.reset();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  const logOut = async () => {
    setBusy(true);
    await api.auth.signOut();
    setBusy(false);
    leave();
  };

  const deleteAccount = () =>
    Alert.alert(
      'Delete your account?',
      'Your profile, chats, photos and documents will be permanently deleted. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await api.auth.deleteAccount();
              leave();
            } catch (e) {
              reportError(e, { where: 'delete-account' });
              Alert.alert("Couldn't delete account", friendlyError(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );

  return (
    <Screen>
      <HeaderRow title="Settings" style={{ paddingHorizontal: TAB_PAD }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingBottom: s(40) }}>
        <Section title="ACCOUNT">
          <Row label="Email" value={email ?? '—'} />
          <Divider />
          <Row label="Phone number" value={p.phone ? `+91 ${formatPhone(p.phone)}` : 'Not added'} onPress={() => router.push('/edit-profile')} />
          <Divider />
          <Row label="City" value={p.city ?? '—'} onPress={() => router.push('/auth/city?mode=change')} />
          <Divider />
          <Row
            label="Membership"
            value={active ? 'Unlocked' : 'Locked'}
            valueStyle={{ color: active ? colors.online : colors.textMuted, fontFamily: fonts.display }}
            onPress={manageMembership}
          />
        </Section>

        <Section title="NOTIFICATIONS">
          <Row
            label="New requests"
            right={<Toggle label="New requests" value={p.notify_requests} onChange={(v) => setPref({ notify_requests: v })} />}
          />
          <Divider />
          <Row
            label="Messages"
            right={<Toggle label="Messages" value={p.notify_messages} onChange={(v) => setPref({ notify_messages: v })} />}
          />
        </Section>

        <Section title="PRIVACY">
          <Row
            label="Show my exact distance"
            right={
              <Toggle
                label="Show my exact distance"
                value={p.show_exact_distance}
                onChange={(v) => setPref({ show_exact_distance: v })}
              />
            }
          />
          <Divider />
          <Row label="Blocked members" value={blocked.length ? String(blocked.length) : undefined} chevron onPress={showBlocked} />
        </Section>
        <Text style={[t.helper, { marginTop: s(8), marginHorizontal: s(4) }]}>
          When off, others see a rounded distance like "~1.5 km". Your location is never shown to anyone.
        </Text>

        <Section title="LEGAL & SAFETY">
          <Row
            label="Verification status"
            value={verification.text}
            valueStyle={{ color: verification.color, fontFamily: fonts.display }}
            onPress={() => router.push('/auth/verify-docs?mode=manage')}
          />
          <Divider />
          <Row label="Community Guidelines" chevron onPress={() => router.push('/legal/guidelines')} />
          <Divider />
          <Row label="Terms of Service" chevron onPress={() => router.push('/legal/terms')} />
          <Divider />
          <Row label="Privacy Policy" chevron onPress={() => router.push('/legal/privacy')} />
        </Section>

        {p.is_admin && (
          <Section title="ADMIN">
            <Row label="Admin tools" chevron onPress={() => router.push('/admin')} />
          </Section>
        )}

        <Section title="ACCOUNT ACTIONS">
          <Row label={busy ? 'Please wait…' : 'Log out'} onPress={busy ? undefined : logOut} />
          <Divider />
          <Row label="Delete account" labelStyle={{ color: colors.danger }} onPress={busy ? undefined : deleteAccount} />
        </Section>

        <Text style={[t.helper, { textAlign: 'center', marginTop: s(20) }]}>
          {env.appEnv === 'production' ? 'Vyaparhood' : 'Vyaparhood · DEVELOPMENT'}
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={[t.sectionLabel, { marginTop: s(24), marginBottom: s(10), marginLeft: s(6) }]}>{title}</Text>
      <SoftCard radius={s(24)} innerStyle={{ paddingHorizontal: s(20) }}>
        {children}
      </SoftCard>
    </View>
  );
}

function Row({
  label,
  value,
  right,
  chevron,
  onPress,
  valueStyle,
  labelStyle,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  valueStyle?: object;
  labelStyle?: object;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {value ? <Text style={[styles.value, valueStyle]}>{value}</Text> : null}
      {right}
      {chevron && <ChevronRight size={s(19)} color={colors.textMuted} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: s(58) },
  label: { fontFamily: fonts.bodyBold, fontSize: s(17), color: colors.ink, flex: 1 },
  value: { fontFamily: fonts.body, fontSize: s(16), color: colors.textMuted, marginTop: s(2) },
});
