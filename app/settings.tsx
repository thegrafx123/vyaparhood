import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import * as api from '../src/api';
import { friendlyError } from '../src/api/errors';
import { ProfileUpdate } from '../src/api/types';
import { DELETE_AFTER_DAYS, SUPPORT_EMAIL } from '../src/config';
import { env } from '../src/lib/env';
import { FadeUp } from '../src/motion';
import { PLANS, rupees } from '../src/services/payments';
import { useApp } from '../src/state/AppStore';
import { meKey, useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';
import { formatPhone } from '../src/utils/validation';
import { TextButton } from '../src/ui/Buttons';
import { Group, Row, SectionLabel } from '../src/ui/Cards';
import { Toggle } from '../src/ui/Form';
import { HeaderRow } from '../src/ui/Header';
import { Screen } from '../src/ui/Screen';

const longDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/** 28 · Settings — with account deletion (hidden now, deleted after 30 days). */
export default function Settings() {
  const router = useRouter();
  const qc = useQueryClient();
  const { me, userId, phone } = useAuth();
  const { actions } = useApp();
  const [deleting, setDeleting] = useState(false);
  const p = me?.profile;
  if (!p || !me) return null;

  const plan = PLANS.find((x) => x.id === me.membership?.plan_id);
  const membership = me.membership?.active
    ? 'Unlocked'
    : me.billingEnabled
      ? 'Not active'
      : plan
        ? `Beta · ${rupees(plan.price)}/${plan.period === 'month' ? 'mo' : 'wk'} plan`
        : 'Free beta';
  const verified = p.verification_status === 'verified';
  const shownPhone = phone ? `+${phone.slice(0, phone.length - 10)} ${formatPhone(phone.slice(-10))}` : '—';

  // Optimistic toggle: update the cached profile, then save.
  const setPref = async (patch: ProfileUpdate) => {
    const key = meKey(userId);
    const prev = qc.getQueryData(key);
    qc.setQueryData(key, { ...me, profile: { ...p, ...patch } });
    try {
      await api.me.update(patch);
    } catch (e) {
      qc.setQueryData(key, prev);
      Alert.alert('Could not save', friendlyError(e));
    }
  };

  const logOut = () =>
    Alert.alert('Log out?', 'You can log back in with your phone number anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await api.auth.signOut();
          actions.resetSession();
          router.replace('/welcome');
        },
      },
    ]);

  const deleteAccount = () => {
    const on = new Date(Date.now() + DELETE_AFTER_DAYS * 86400000);
    Alert.alert(
      'Delete your account?',
      `Your profile will be hidden from everyone right away and permanently deleted on ${longDate(on)} — your photo, business details, requests and chats.\n\nChanged your mind? Just log back in before then to restore it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const until = await api.me.requestDeletion();
              await api.auth.signOut();
              actions.resetSession();
              router.replace('/welcome');
              Alert.alert(
                'Account scheduled for deletion',
                `It will be permanently deleted on ${longDate(new Date(until))}. Log back in before then if you want to keep it.`,
              );
            } catch (e) {
              setDeleting(false);
              Alert.alert('Could not delete account', friendlyError(e));
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <HeaderRow title="Settings" titleSize={s(20)} pad={s(20)} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: s(24), paddingTop: s(8), paddingBottom: s(40) }}>
        <SectionLabel delay={100}>Account</SectionLabel>
        <Group delay={100}>
          <Row label="Phone number" value={shownPhone} />
          <Row label="City" value={p.city ?? '—'} onPress={() => router.push('/edit-profile')} />
          <Row
            label="Business address"
            value={me.business ? [me.business.locality, me.business.pincode].filter(Boolean).join(' · ') : 'Add address'}
            onPress={() => router.push('/edit-profile')}
          />
          <Row label="Membership" value={membership} valueColor={me.membership?.active || !me.billingEnabled ? colors.green : colors.muted} valueBold />
        </Group>

        <SectionLabel delay={160}>Notifications</SectionLabel>
        <Group delay={160}>
          <Row
            label="New requests"
            padV={s(13)}
            right={<Toggle label="New requests" value={p.notify_requests} onChange={(v) => setPref({ notify_requests: v })} settleDelay={450} />}
          />
          <Row
            label="Messages"
            padV={s(13)}
            right={<Toggle label="Messages" value={p.notify_messages} onChange={(v) => setPref({ notify_messages: v })} settleDelay={500} />}
          />
        </Group>

        <SectionLabel delay={220}>Privacy</SectionLabel>
        <Group delay={220}>
          <Row
            label="Show my exact distance"
            padV={s(13)}
            right={
              <Toggle
                label="Show my exact distance"
                value={p.show_exact_distance}
                onChange={(v) => setPref({ show_exact_distance: v })}
                settleDelay={550}
              />
            }
          />
          <Row label="Blocked members" onPress={() => router.push('/blocked')} />
        </Group>

        <SectionLabel delay={260}>{'Legal & Safety'}</SectionLabel>
        <Group delay={260}>
          <Row label="Verification status" value={verified ? 'Verified ✓' : 'Not verified'} valueColor={verified ? colors.teal : colors.muted} valueBold />
          <Row label="Community Guidelines" onPress={() => router.push('/legal/guidelines')} />
          <Row label="Terms of Service" onPress={() => router.push('/legal/terms')} />
          <Row label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
          <Row label="Report a problem" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Problem%20in%20the%20app`)} />
        </Group>

        <FadeUp delay={340} style={{ alignItems: 'center', marginTop: s(26), gap: s(18) }}>
          <TextButton label="Log out" display size={s(13.5)} color={colors.orange} onPress={logOut} />
          <TextButton
            label={deleting ? 'Deleting…' : 'Delete account'}
            size={s(12.5)}
            color={colors.error}
            onPress={deleting ? () => {} : deleteAccount}
          />
          <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.placeholder, textAlign: 'center', lineHeight: s(15) }}>
            Deleting hides your profile at once; everything is erased after {DELETE_AFTER_DAYS} days.
          </Text>
          <View style={{ marginTop: s(6) }}>
            <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.placeholder }}>
              {env.appEnv === 'production' ? 'Vyaparhood' : 'Vyaparhood · DEVELOPMENT'}
            </Text>
          </View>
        </FadeUp>
      </ScrollView>
    </Screen>
  );
}
