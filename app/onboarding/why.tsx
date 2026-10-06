import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { FadeUp, Float } from '../../src/motion';
import { colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { CtaButton } from '../../src/ui/Buttons';
import { PageDots } from '../../src/ui/Form';
import { BrandRow } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Coffee, Shield, Target } from '../../src/ui/icons';
import { Blob, Footer, Screen } from '../../src/ui/Screen';

const POINTS = [
  {
    title: 'Verified, real people',
    body: 'Every member verifies their phone number before they can join.',
    bg: colors.tealSoft,
    icon: <Shield size={s(19)} color={colors.teal} />,
  },
  {
    title: 'Matched to what you need',
    body: 'Filter by category and intent — not endless swiping.',
    bg: colors.blueSoft,
    icon: <Target size={s(19)} color={colors.blue} />,
  },
  {
    title: 'Built for real meetups',
    body: 'From a first chat to coffee down the street.',
    bg: colors.orangeSoft,
    icon: <Coffee size={s(19)} color={colors.peach} />,
  },
];

/** 5 · Onboarding — why it works. */
export default function OnboardingWhy() {
  const router = useRouter();
  return (
    <Screen texture>
      <Blob color={colors.lime} size={s(280)} opacity={0.85} rotate="12deg" style={{ top: -s(110), right: -s(120) }} />
      <BrandRow onSkip={() => router.push('/auth/phone')} />

      <FadeUp delay={80} style={{ paddingHorizontal: H_PAD, paddingTop: s(26) }}>
        <AccentHeading parts={['Not another', { accent: 'networking', squiggle: 'ink', drawDelay: 500 }, 'app']} size={29} accentSize={35} />
        <Text style={[t.subtitle, { marginTop: s(10) }]}>Here's what makes finding the right people simple.</Text>
      </FadeUp>

      <View style={{ flex: 1, marginHorizontal: H_PAD, marginTop: s(24) }}>
        {/* The timeline line runs behind all three icons. */}
        <View>
          <View
            style={{ position: 'absolute', left: s(21), top: s(8), bottom: s(8), width: s(3), backgroundColor: colors.line, borderRadius: 999 }}
          />
          {POINTS.map((p, i) => (
            <FadeUp
              key={p.title}
              delay={200 + i * 100}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s(14), marginBottom: i < POINTS.length - 1 ? s(24) : 0 }}
            >
              <Float distance={5} duration={3400} delay={900 + i * 200}>
                <View
                  style={{
                    width: s(44),
                    height: s(44),
                    borderRadius: s(14),
                    backgroundColor: p.bg,
                    borderWidth: s(2.5),
                    borderColor: colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p.icon}
                </View>
              </Float>
              <View style={{ paddingTop: s(5), flex: 1 }}>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: s(14.5), color: colors.ink }}>{p.title}</Text>
                <Text
                  style={{ fontFamily: fonts.bodyMedium, fontSize: s(12.5), lineHeight: s(18), color: colors.text, marginTop: s(3), maxWidth: s(260) }}
                >
                  {p.body}
                </Text>
              </View>
            </FadeUp>
          ))}
        </View>
      </View>

      <FadeUp delay={500}>
        <Footer style={{ alignItems: 'center', gap: s(16), paddingTop: s(18) }}>
          <PageDots count={4} active={3} />
          <CtaButton label="Let's Go" onPress={() => router.push('/auth/phone')} style={{ alignSelf: 'stretch' }} />
        </Footer>
      </FadeUp>
    </Screen>
  );
}
