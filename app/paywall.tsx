import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../src/components/Buttons';
import { Heading } from '../src/components/Heading';
import { ArrowRight, Check } from '../src/components/icons';
import { BackButton, Blob, Footer, Screen } from '../src/components/Layout';
import { DEFAULT_OFFER, payments, rupees } from '../src/services/payments';
import { useApp } from '../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

const BENEFITS = [
  'Full access to verified members in your city',
  'Unlimited connection requests & chats',
  'Cancel anytime from Settings',
];

/**
 * 15 · Paywall. Uses the payment abstraction only — swapping the mock
 * provider for Apple / Google / Cashfree needs no change here.
 */
export default function Paywall() {
  const router = useRouter();
  const { actions } = useApp();
  const offer = DEFAULT_OFFER;
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    const result = await payments.purchase(offer.id);
    setBusy(false);
    if (result.status === 'success') {
      actions.patch({ entitlement: result.entitlement });
      router.replace('/discover');
    } else if (result.status === 'error') {
      Alert.alert('Payment failed', result.message);
    }
  };

  return (
    <Screen>
      <Blob color={colors.blobTeal} size={s(280)} top={-s(120)} left={-s(140)} />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Heading parts={['Start your', { accent: `${rupees(offer.introPrice)} ${offer.introPeriod}`, squiggle: 'lime' }]} />
        <Text style={[t.subtitle, { marginTop: s(6) }]}>
          Try Vyaparhood for {rupees(offer.introPrice)} in {offer.introPeriod} one. After that you're automatically on
          the {offer.period}ly plan — cancel whenever.
        </Text>

        <View style={styles.cards}>
          <View style={styles.introWrap}>
            <View style={styles.introShadow} />
            <View style={styles.intro}>
              <View style={styles.introTag}>
                <Text style={styles.introTagText}>{offer.introPeriod.toUpperCase()} 1</Text>
              </View>
              <Text style={styles.introPrice}>{rupees(offer.introPrice)}</Text>
              <Text style={styles.introNote}>{offer.introNote}</Text>
            </View>
          </View>
          <View style={styles.arrow}>
            <ArrowRight size={s(22)} color={colors.ink} strokeWidth={2.4} />
          </View>
          <View style={styles.regular}>
            <View style={styles.regularTag}>
              <Text style={styles.regularTagText}>FROM {offer.introPeriod.toUpperCase()} 2</Text>
            </View>
            <Text style={styles.regularPrice}>
              {rupees(offer.price)}
              <Text style={styles.per}>/{offer.period === 'month' ? 'mo' : offer.period}</Text>
            </Text>
            <Text style={styles.regularNote}>billed {offer.period}ly</Text>
          </View>
        </View>

        <View style={styles.auto}>
          <View style={styles.autoDot} />
          <Text style={[t.helper, { fontSize: s(13.5) }]}>
            Auto-switches to {offer.period}ly — no separate action needed
          </Text>
        </View>

        <View style={{ marginTop: s(16) }}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefit}>
              <View style={styles.check}>
                <Check size={s(15)} color={colors.teal} strokeWidth={2.6} />
              </View>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Footer>
        <PrimaryButton
          label={`Start ${rupees(offer.introPrice)} ${offer.introPeriod[0].toUpperCase()}${offer.introPeriod.slice(1)}`}
          onPress={start}
          loading={busy}
        />
        <Text style={styles.fine}>
          {rupees(offer.introPrice)} charged today for {offer.introPeriod} one. {rupees(offer.price)}/{offer.period} billed
          automatically after — cancel anytime in Settings.
        </Text>
      </Footer>
    </Screen>
  );
}

const CARD_H = s(122);
const styles = StyleSheet.create({
  header: { paddingHorizontal: H_PAD, paddingTop: s(14) },
  content: { paddingHorizontal: H_PAD, paddingTop: s(26), paddingBottom: s(16) },
  cards: { flexDirection: 'row', alignItems: 'center', marginTop: s(22) },
  introWrap: { flex: 1, height: CARD_H },
  introShadow: {
    position: 'absolute',
    left: s(4),
    top: s(5),
    right: -s(4),
    bottom: -s(5),
    backgroundColor: colors.shadowSoft,
    borderTopLeftRadius: s(20),
    borderBottomLeftRadius: s(20),
  },
  intro: {
    flex: 1,
    backgroundColor: colors.navy,
    borderTopLeftRadius: s(20),
    borderBottomLeftRadius: s(20),
    padding: s(16),
    justifyContent: 'space-between',
  },
  introTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lime,
    borderRadius: s(10),
    paddingHorizontal: s(8),
    height: s(20),
    justifyContent: 'center',
  },
  introTagText: { fontFamily: fonts.display, fontSize: s(11.5), color: colors.ink, marginTop: s(1) },
  introPrice: { fontFamily: fonts.display, fontSize: s(32), color: colors.white, lineHeight: s(38) },
  introNote: { fontFamily: fonts.body, fontSize: s(13), color: colors.navyText },
  arrow: { width: s(30), alignItems: 'center' },
  regular: {
    flex: 1,
    height: CARD_H,
    backgroundColor: colors.white,
    borderWidth: BORDER,
    borderLeftWidth: 0,
    borderColor: colors.ink,
    borderTopRightRadius: s(20),
    borderBottomRightRadius: s(20),
    padding: s(16),
    justifyContent: 'space-between',
  },
  regularTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blueSoft,
    borderRadius: s(10),
    paddingHorizontal: s(8),
    height: s(22),
    justifyContent: 'center',
  },
  regularTagText: { fontFamily: fonts.bodyBold, fontSize: s(12), color: colors.blue },
  regularPrice: { fontFamily: fonts.display, fontSize: s(32), color: colors.ink, lineHeight: s(38) },
  per: { fontFamily: fonts.bodyBold, fontSize: s(15), color: colors.textMuted },
  regularNote: { fontFamily: fonts.body, fontSize: s(13), color: colors.textMuted },
  auto: { flexDirection: 'row', alignItems: 'center', marginTop: s(16) },
  autoDot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#8FB2F3', marginRight: s(8) },
  benefit: { flexDirection: 'row', alignItems: 'center', marginTop: s(12) },
  check: {
    width: s(26),
    height: s(26),
    borderRadius: s(7),
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(14),
  },
  benefitText: { fontFamily: fonts.bodyBold, fontSize: s(16), color: colors.ink, flex: 1 },
  fine: {
    fontFamily: fonts.body,
    fontSize: s(13),
    lineHeight: s(18),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: s(12),
  },
});
