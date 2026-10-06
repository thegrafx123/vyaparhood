import React from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeUp, KenBurns, PinPop, Wiggle } from '../motion';
import { colors, fonts, s, shadow } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { CtaButton } from './Buttons';
import { PageDots } from './Form';
import { AccentHeading, HeadingPart } from './Heading';
import { Check, Heart, NoDM, Pin } from './icons';
import { Screen } from './Screen';

const HERO = require('../../assets/images/hero-splash.jpg');
const HERO_RATIO = 1440 / 1092;

/**
 * Slides 2 and 2b: hero photo with a slow Ken Burns zoom, and a rounded
 * sheet that slides up over it with the heading, trust row and button.
 */
export function SplashLayout({
  heading,
  subtitle,
  city,
  onStart,
  loading,
}: {
  heading: HeadingPart[];
  subtitle: string;
  /** Shows the "<City> · Live now" pill (slide 2b). */
  city?: string | null;
  onStart: () => void;
  loading?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroH = Math.min(Math.max(height - s(340) - insets.bottom * 0.5, s(240)), s(514));
  const imgH = width * HERO_RATIO;

  return (
    <Screen padTop={false}>
      <View style={{ height: heroH, overflow: 'hidden' }}>
        <KenBurns style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <Image
            source={HERO}
            accessibilityLabel="Vyaparhood — your city, your people, real opportunities"
            style={{ position: 'absolute', width, height: imgH, top: -Math.max(imgH - heroH, 0) * 0.08 }}
          />
        </KenBurns>
        {city ? (
          <PinPop delay={350} style={{ position: 'absolute', top: insets.top + s(12), left: s(26) }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: s(6),
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: s(2),
                borderColor: colors.ink,
                borderRadius: 999,
                paddingVertical: s(6),
                paddingLeft: s(8),
                paddingRight: s(12),
              }}
            >
              <Pin size={s(13)} color={colors.blue} sw={2.2} />
              <Text style={{ fontFamily: fonts.displayBold, fontSize: s(12), color: colors.ink, marginTop: s(1) }}>{city}</Text>
              <View style={{ width: s(5), height: s(5), borderRadius: s(3), backgroundColor: colors.green }} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(10), color: colors.greenText }}>Live now</Text>
            </View>
          </PinPop>
        ) : null}
      </View>

      <FadeUp
        delay={150}
        duration={600}
        style={{
          flex: 1,
          zIndex: 3,
          backgroundColor: colors.bg,
          borderTopLeftRadius: s(28),
          borderTopRightRadius: s(28),
          marginTop: -s(28),
          boxShadow: shadow.sheetTop,
          paddingTop: s(26),
          paddingHorizontal: s(26),
          paddingBottom: Math.max(insets.bottom + s(8), s(24)),
        }}
      >
        <AccentHeading parts={heading} size={27} accentSize={32} />
        <Text style={[t.subtitle, { marginTop: s(9) }]}>{subtitle}</Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: s(8),
            marginTop: s(22),
            paddingVertical: s(14),
            borderTopWidth: s(1.5),
            borderBottomWidth: s(1.5),
            borderColor: colors.lineSoft,
          }}
        >
          <Trust label="Verified only" bg={colors.tealSoft} delay={0} icon={<Check size={s(13)} color={colors.teal} sw={3} />} />
          <Divider />
          <Trust label="Curated network" bg={colors.blueSoft} delay={500} icon={<Heart size={s(13)} color={colors.blue} />} />
          <Divider />
          <Trust label="No cold DMs" bg={colors.orangeSoft} delay={1000} icon={<NoDM size={s(13)} color={colors.peach} />} />
        </View>

        <View style={{ flex: 1, minHeight: s(14) }} />
        <View style={{ marginBottom: s(16) }}>
          <PageDots count={4} active={0} />
        </View>
        <CtaButton label="Get Started" circle="left" onPress={onStart} loading={loading} />
      </FadeUp>
    </Screen>
  );
}

function Trust({ label, icon, bg, delay }: { label: string; icon: React.ReactNode; bg: string; delay: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Wiggle delay={delay}>
        <View
          style={{
            width: s(26),
            height: s(26),
            borderRadius: s(8),
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: s(5),
          }}
        >
          {icon}
        </View>
      </Wiggle>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(11), color: colors.ink }}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: s(1.5), height: s(34), backgroundColor: colors.lineSoft }} />;
}
