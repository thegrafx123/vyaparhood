import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as api from '../src/api';
import { friendlyError } from '../src/api/errors';
import { PlanId } from '../src/api/types';
import { FadeUp, PulseDot } from '../src/motion';
import { payments, PLANS, PlanOffer, rupees } from '../src/services/payments';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, H_PAD, s, shadow } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { CtaButton, TextButton } from '../src/ui/Buttons';
import { Helper } from '../src/ui/Form';
import { AccentHeading } from '../src/ui/Heading';
import { Check } from '../src/ui/icons';
import { Blob, Footer, Screen } from '../src/ui/Screen';

const BENEFITS = [
  'Full access to verified members in your city',
  'Unlimited connection requests & chats',
  'Cancel anytime from Settings',
];

/**
 * 14 · Plans. ₹299/month (early bird, highlighted) or ₹99 for a week.
 * Billing isn't connected yet: while it's off, picking a plan lets the
 * member in free (beta) and records their choice.
 */
export default function Paywall() {
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const [plan, setPlan] = useState<PlanId>('monthly_299');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const billing = !!me?.billingEnabled;
  const chosen = PLANS.find((p) => p.id === plan)!;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      if (billing) {
        const result = await payments.purchase(plan);
        if (result.status === 'error') throw new Error(result.message);
        if (result.status === 'cancelled') return;
      } else {
        await api.me.choosePlan(plan);
      }
      await refreshMe();
      router.replace('/discover');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen texture>
      <Blob color={colors.tealBlob} size={s(260)} opacity={0.14} style={{ top: -s(100), left: -s(110) }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <FadeUp delay={80} style={{ paddingHorizontal: H_PAD, paddingTop: s(40) }}>
          <AccentHeading parts={['Pick your', { accent: 'plan', drawDelay: 450 }]} size={28} accentSize={34} lineHeight={1.1} />
          <Text style={[t.subtitle, { marginTop: s(8) }]}>
            Meet verified business owners in {me?.profile.city ?? 'your city'} — request, chat and meet up. Cancel whenever.
          </Text>
        </FadeUp>

        <FadeUp delay={160} style={{ marginHorizontal: H_PAD, marginTop: s(22) }}>
          <View style={{ flexDirection: 'row', gap: s(12) }}>
            {PLANS.map((p) => (
              <PlanCard key={p.id} plan={p} selected={plan === p.id} onPress={() => setPlan(p.id)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(12), paddingLeft: s(2) }}>
            <PulseDot>
              <View style={{ width: s(6), height: s(6), borderRadius: s(3), backgroundColor: colors.blue }} />
            </PulseDot>
            <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.muted, flex: 1 }}>
              {billing ? 'Renews automatically — cancel anytime in Settings' : "We're in beta — no payment needed today"}
            </Text>
          </View>
        </FadeUp>

        <FadeUp delay={240} style={{ marginHorizontal: H_PAD, marginTop: s(18), gap: s(9) }}>
          {BENEFITS.map((b) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
              <View
                style={{
                  width: s(22),
                  height: s(22),
                  borderRadius: s(7),
                  backgroundColor: colors.tealSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={s(12)} color={colors.teal} sw={3} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: s(12.5), color: colors.ink, flex: 1 }}>{b}</Text>
            </View>
          ))}
        </FadeUp>

        {error ? (
          <View style={{ paddingHorizontal: H_PAD }}>
            <Helper error>{error}</Helper>
          </View>
        ) : null}

        <View style={{ flex: 1, minHeight: s(20) }} />

        <FadeUp delay={320}>
          <Footer style={{ paddingTop: s(16), paddingBottom: s(4) }}>
            <CtaButton
              label={`Start ${rupees(chosen.price)} ${chosen.period === 'month' ? 'Month' : 'Week'}`}
              size="md"
              onPress={start}
              loading={busy}
            />
          </Footer>
        </FadeUp>
        <FadeUp delay={380} style={{ paddingHorizontal: H_PAD, paddingBottom: s(30), paddingTop: s(10), alignItems: 'center', gap: s(8) }}>
          <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), lineHeight: s(16), color: colors.muted, textAlign: 'center' }}>
            {billing
              ? chosen.period === 'month'
                ? `${rupees(chosen.price)} billed monthly. Cancel anytime in Settings.`
                : `${rupees(chosen.price)} for 7 days of full access.`
              : "Free during our beta — you won't be charged. We'll ask before any billing starts."}
          </Text>
          <TextButton label="Terms of Service" size={s(11.5)} color={colors.text} onPress={() => router.push('/legal/terms')} />
        </FadeUp>
      </ScrollView>
    </Screen>
  );
}

function PlanCard({ plan, selected, onPress }: { plan: PlanOffer; selected: boolean; onPress: () => void }) {
  const dark = !!plan.highlighted;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${plan.title}, ${rupees(plan.price)} per ${plan.period}${plan.badge ? `, ${plan.badge.toLowerCase()}` : ''}`}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: dark ? colors.ink : colors.white,
          borderRadius: s(18),
          borderWidth: s(2.5),
          borderColor: selected ? (dark ? colors.lime : colors.blue) : colors.ink,
          padding: s(14),
          paddingTop: s(16),
          boxShadow: selected ? shadow.cta : shadow.deep,
          transform: [{ translateY: selected ? -s(2) : 0 }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              backgroundColor: dark ? colors.lime : colors.blueSoft,
              borderRadius: 999,
              paddingHorizontal: s(7),
              paddingVertical: s(2),
            }}
          >
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: s(9), letterSpacing: 0.3, color: dark ? colors.ink : colors.blue }}>
              {plan.badge ?? plan.title.toUpperCase()}
            </Text>
          </View>
          <View
            style={{
              width: s(18),
              height: s(18),
              borderRadius: s(9),
              borderWidth: s(2),
              borderColor: dark ? colors.lime : colors.ink,
              backgroundColor: selected ? (dark ? colors.lime : colors.blue) : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected && <Check size={s(10)} color={dark ? colors.ink : colors.white} sw={3.4} />}
          </View>
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: s(26), color: dark ? colors.white : colors.ink, marginTop: s(8) }}>
          {rupees(plan.price)}
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: s(12), color: dark ? colors.navyText : colors.muted }}>
            {plan.period === 'month' ? '/mo' : '/week'}
          </Text>
        </Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(12), color: dark ? colors.white : colors.ink, marginTop: s(2) }}>
          {plan.title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: s(10.5), lineHeight: s(14), color: dark ? colors.navyText : colors.muted, marginTop: s(4) }}>
          {plan.note}
        </Text>
      </View>
    </Pressable>
  );
}
