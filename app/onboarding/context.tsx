import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { FadeUp, Float } from '../../src/motion';
import { colors, fonts, H_PAD, s, shadow } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { CtaButton } from '../../src/ui/Buttons';
import { PageDots } from '../../src/ui/Form';
import { BrandRow } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Check, Mail } from '../../src/ui/icons';
import { Footer, Screen } from '../../src/ui/Screen';

const RIYA = require('../../assets/images/avatar-girl-glasses.jpg');

/** 4 · Onboarding — connect with context, not cold DMs. */
export default function OnboardingContext() {
  const router = useRouter();
  return (
    <Screen texture>
      <BrandRow onSkip={() => router.push('/auth/phone')} />

      <FadeUp delay={100} style={{ paddingHorizontal: H_PAD, paddingTop: s(24) }}>
        <AccentHeading parts={['Connect with context,', { accent: 'not cold DMs', drawDelay: 500 }]} size={29} accentSize={34} />
        <Text style={[t.subtitle, { fontSize: s(14), marginTop: s(10) }]}>
          Add a short note with every request. Chat unlocks once they say yes.
        </Text>
      </FadeUp>

      <View style={{ flex: 1, marginHorizontal: H_PAD, marginTop: s(34) }}>
        <FadeUp delay={200}>
          <View
            style={{
              backgroundColor: colors.white,
              borderWidth: s(2.5),
              borderColor: colors.ink,
              borderRadius: s(22),
              padding: s(16),
              boxShadow: shadow.cta,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
              <Image source={RIYA} style={{ width: s(40), height: s(40), borderRadius: s(12) }} />
              <View>
                <Text style={{ fontFamily: fonts.body, fontSize: s(10.5), color: colors.muted }}>Sending a request to</Text>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: s(13.5), color: colors.ink }}>Riya Sharma</Text>
              </View>
            </View>
            <View style={{ marginTop: s(12), backgroundColor: colors.inputBg, borderRadius: s(12), paddingVertical: s(10), paddingHorizontal: s(12) }}>
              <Text style={{ fontFamily: fonts.body, fontSize: s(12.5), lineHeight: s(19), color: colors.ink }}>
                "Hi, I run a small cafe and would love to collaborate on branding."
              </Text>
            </View>
          </View>
        </FadeUp>

        <View style={{ position: 'absolute', top: -s(14), right: s(4), transform: [{ rotate: '-5deg' }] }}>
          <Float distance={7} duration={3400} delay={950} enterDelay={320}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: s(8),
                backgroundColor: colors.white,
                borderRadius: s(16),
                paddingVertical: s(8),
                paddingLeft: s(8),
                paddingRight: s(14),
                borderWidth: s(2.5),
                borderColor: colors.ink,
                boxShadow: shadow.card,
              }}
            >
              <View
                style={{
                  width: s(22),
                  height: s(22),
                  borderRadius: s(8),
                  backgroundColor: colors.blueSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={s(12)} color={colors.blue} sw={2} />
              </View>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(12), color: colors.ink }}>No cold DMs</Text>
            </View>
          </Float>
        </View>

        <FadeUp delay={400} style={{ marginTop: s(18) }}>
          <View
            style={{
              backgroundColor: colors.ink,
              borderRadius: s(18),
              paddingVertical: s(14),
              paddingHorizontal: s(16),
              flexDirection: 'row',
              alignItems: 'center',
              gap: s(10),
            }}
          >
            <View
              style={{
                width: s(24),
                height: s(24),
                borderRadius: s(12),
                backgroundColor: colors.lime,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={s(12)} color={colors.ink} sw={3.4} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: s(12.5), color: colors.white, flex: 1 }}>
              Connection approved — you can chat now
            </Text>
          </View>
        </FadeUp>
      </View>

      <FadeUp delay={480}>
        <Footer style={{ alignItems: 'center', gap: s(16), paddingTop: s(18) }}>
          <PageDots count={4} active={2} />
          <CtaButton label="Next" onPress={() => router.push('/onboarding/why')} style={{ alignSelf: 'stretch' }} />
        </Footer>
      </FadeUp>
    </Screen>
  );
}
