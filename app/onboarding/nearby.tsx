import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageSourcePropType, Text, View } from 'react-native';
import { FadeUp, Float, KenBurns } from '../../src/motion';
import { colors, fonts, H_PAD, s, shadow } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { CtaButton } from '../../src/ui/Buttons';
import { CoverImage } from '../../src/ui/CoverImage';
import { PageDots } from '../../src/ui/Form';
import { BrandRow } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Footer, Screen } from '../../src/ui/Screen';

const HERO = require('../../assets/images/onboarding-hero.jpg');
const MEERA = require('../../assets/images/avatar-girl-glasses.jpg');
const ROHAN = require('../../assets/images/avatar-boy-hoodie.jpg');
const ARJUN = require('../../assets/images/avatar-boy-backpack.jpg');

/** 3 · Onboarding — find the right people nearby. */
export default function OnboardingNearby() {
  const router = useRouter();
  return (
    <Screen texture>
      <BrandRow onSkip={() => router.push('/auth/phone')} />

      <FadeUp delay={100} style={{ paddingHorizontal: H_PAD, paddingTop: s(24) }}>
        <AccentHeading parts={['Find the right people in your', { accent: 'city', drawDelay: 500 }]} size={30} accentSize={36} lineHeight={1.1} />
        <Text style={[t.subtitle, { fontSize: s(14), marginTop: s(10), maxWidth: s(280) }]}>
          See who's building what — right around you, or across the city.
        </Text>
      </FadeUp>

      <View style={{ flex: 1, marginHorizontal: H_PAD, marginTop: s(18) }}>
        <FadeUp delay={200} style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              borderRadius: s(28),
              borderWidth: s(2.5),
              borderColor: colors.ink,
              overflow: 'hidden',
              boxShadow: shadow.soft,
              backgroundColor: colors.blueSoft,
            }}
          >
            <KenBurns from={1.08} duration={9000} origin="50% 30%" style={{ flex: 1 }}>
              <CoverImage source={HERO} aspect={1494 / 1052} focusY={0.22} label="A business owner nearby" style={{ flex: 1 }} />
            </KenBurns>
          </View>
        </FadeUp>

        <Mini
          photo={MEERA}
          name="Meera"
          role="Graphic Designer"
          rotate="4deg"
          float={{ duration: 3200, delay: 900, enter: 280 }}
          position={{ top: s(16), right: -s(6) }}
        />
        <Mini
          photo={ROHAN}
          name="Rohan"
          role="Cafe Owner"
          rotate="-4deg"
          float={{ duration: 3600, delay: 1000, enter: 340 }}
          position={{ bottom: s(96), left: -s(10) }}
        />
        <Mini
          photo={ARJUN}
          name="Arjun"
          role="Fitness Trainer"
          rotate="3deg"
          float={{ duration: 4000, delay: 1100, enter: 400 }}
          position={{ bottom: -s(8), right: s(8) }}
        />
      </View>

      <FadeUp delay={480}>
        <Footer style={{ alignItems: 'center', gap: s(16), paddingTop: s(18) }}>
          <PageDots count={4} active={1} />
          <CtaButton label="Next" onPress={() => router.push('/onboarding/context')} style={{ alignSelf: 'stretch' }} />
        </Footer>
      </FadeUp>
    </Screen>
  );
}

/** `.vh-mini` — floating profile sticker. */
function Mini({
  photo,
  name,
  role,
  rotate,
  float,
  position,
}: {
  photo: ImageSourcePropType;
  name: string;
  role: string;
  rotate: string;
  float: { duration: number; delay: number; enter: number };
  position: { top?: number; bottom?: number; left?: number; right?: number };
}) {
  return (
    <View style={[{ position: 'absolute', transform: [{ rotate }] }, position]}>
      <Float distance={7} duration={float.duration} delay={float.delay} enterDelay={float.enter}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: s(8),
            backgroundColor: colors.white,
            borderWidth: s(2.5),
            borderColor: colors.ink,
            borderRadius: s(16),
            padding: s(6),
            paddingRight: s(12),
            boxShadow: shadow.card,
          }}
        >
          <Image source={photo} style={{ width: s(36), height: s(36), borderRadius: s(10) }} />
          <View>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: s(12), color: colors.ink }}>{name}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: s(10), color: colors.text }}>{role}</Text>
          </View>
        </View>
      </Float>
    </View>
  );
}
