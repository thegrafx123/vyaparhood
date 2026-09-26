import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Toggle } from '../src/components/Controls';
import { ChevronRight } from '../src/components/icons';
import { Divider, HeaderRow, Screen, SoftCard } from '../src/components/Layout';
import { payments } from '../src/services/payments';
import { myCity, useApp } from '../src/state/AppStore';
import { colors, fonts, s, TAB_PAD } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { formatPhone } from '../src/utils/validation';

/** 30 · Settings. */
export default function SettingsScreen() {
  const router = useRouter();
  const { state, actions } = useApp();
  const st = state.settings;

  const verification =
    state.verification === 'verified'
      ? { text: 'Verified ✓', color: colors.teal }
      : state.verification === 'pending'
        ? { text: 'Under review', color: colors.yellow }
        : { text: 'Not submitted', color: colors.textMuted };

  const manageMembership = () => {
    const url = payments.manageUrl();
    if (url) Linking.openURL(url);
    else
      Alert.alert(
        'Membership',
        'Managing or cancelling your membership will open here once payments go live.',
      );
  };

  const showBlocked = () => {
    const names = state.blockedIds.map((id) => state.members.find((m) => m.id === id)?.name).filter(Boolean);
    if (!names.length) return Alert.alert('Blocked members', "You haven't blocked anyone.");
    Alert.alert('Blocked members', names.join('\n'), [
      { text: 'Close', style: 'cancel' },
      { text: 'Unblock all', onPress: actions.unblockAll },
    ]);
  };

  const wipeAndRestart = () => {
    actions.reset();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  const deleteAccount = () =>
    Alert.alert(
      'Delete your account?',
      'Your profile, chats and documents will be permanently removed within 30 days. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: wipeAndRestart },
      ],
    );

  return (
    <Screen>
      <HeaderRow title="Settings" style={{ paddingHorizontal: TAB_PAD }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingBottom: s(40) }}>
        <Section title="ACCOUNT">
          <Row label="Phone number" value={state.phone ? `+91 ${formatPhone(state.phone)}` : '—'} />
          <Divider />
          <Row label="City" value={myCity(state)} onPress={() => router.push('/auth/city?mode=change')} />
          <Divider />
          <Row
            label="Membership"
            value={state.entitlement.active ? 'Unlocked' : 'Locked'}
            valueStyle={{ color: state.entitlement.active ? colors.online : colors.textMuted, fontFamily: fonts.display }}
            onPress={manageMembership}
          />
        </Section>

        <Section title="NOTIFICATIONS">
          <Row label="New requests" right={<Toggle label="New requests" value={st.notifyRequests} onChange={(v) => actions.setSettings({ notifyRequests: v })} />} />
          <Divider />
          <Row label="Messages" right={<Toggle label="Messages" value={st.notifyMessages} onChange={(v) => actions.setSettings({ notifyMessages: v })} />} />
        </Section>

        <Section title="PRIVACY">
          <Row
            label="Show my exact distance"
            right={
              <Toggle
                label="Show my exact distance"
                value={st.showExactDistance}
                onChange={(v) => actions.setSettings({ showExactDistance: v })}
              />
            }
          />
          <Divider />
          <Row label="Blocked members" chevron onPress={showBlocked} />
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

        <Section title="ACCOUNT ACTIONS">
          <Row label="Log out" onPress={wipeAndRestart} />
          <Divider />
          <Row label="Delete account" labelStyle={{ color: colors.danger }} onPress={deleteAccount} />
        </Section>
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
