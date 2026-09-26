import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/Buttons';
import { Dots } from '../src/components/Controls';
import { Heading } from '../src/components/Heading';
import { Check, Heart, MapPin, X } from '../src/components/icons';
import { Divider } from '../src/components/Layout';
import { LIVE_CITIES } from '../src/config';
import { useApp } from '../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

const HERO = require('../assets/images/hero.jpg');
const HERO_RATIO = 1404 / 1170; // height / width of the cropped hero

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { state } = useApp();
  const [sheetH, setSheetH] = useState(s(360));

  const city = state.location.detectedCity ?? state.location.manualAddress?.city ?? null;
  const liveCity = city ? LIVE_CITIES.find((c) => c.toLowerCase() === city.toLowerCase()) : undefined;

  // Hero fills everything above the sheet (plus the rounded overlap).
  const heroH = Math.max(width * HERO_RATIO, height - sheetH - insets.top + s(40));

  const onSheetLayout = (e: LayoutChangeEvent) => setSheetH(e.nativeEvent.layout.height);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: colors.heroSky }} />
      <Image source={HERO} style={{ width, height: heroH }} resizeMode="cover" accessibilityIgnoresInvertColors />

      {liveCity && (
        <View style={[styles.livePill, { top: insets.top + s(6) }]}>
          <MapPin size={s(17)} color={colors.blue} strokeWidth={2.3} />
          <Text style={styles.liveCity}>{liveCity}</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live now</Text>
        </View>
      )}

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, s(14)) + s(8) }]} onLayout={onSheetLayout}>
        {liveCity ? (
          <Heading
            parts={['Your', { accent: liveCity, squiggle: 'lime' }, 'business, sorted']}
            size={s(28)}
            lineHeight={s(36)}
          />
        ) : (
          <Heading parts={["Your city's business,", { accent: 'sorted', squiggle: false }]} size={s(28)} lineHeight={s(36)} />
        )}
        <Text style={[t.subtitle, { fontSize: s(16), marginTop: s(8) }]}>
          {liveCity
            ? `Real business owners in ${liveCity}. Real conversations. Zero cold DMs.`
            : 'Real business owners. Real conversations. Zero cold DMs.'}
        </Text>

        <Divider style={{ marginTop: s(24) }} />
        <View style={styles.features}>
          <Feature
            label="Verified only"
            bg={colors.tealSoft}
            icon={<Check size={s(15)} color={colors.teal} strokeWidth={2.6} />}
          />
          <View style={styles.vr} />
          <Feature
            label="Curated network"
            bg={colors.blueSoft}
            icon={<Heart size={s(15)} color={colors.blue} strokeWidth={2.3} />}
          />
          <View style={styles.vr} />
          <Feature
            label="No cold DMs"
            bg={colors.orangeSoft}
            icon={
              <View style={styles.xBox}>
                <X size={s(10)} color={colors.peachIcon} strokeWidth={2.6} />
              </View>
            }
          />
        </View>
        <Divider />

        <View style={{ marginTop: s(22), marginBottom: s(22) }}>
          <Dots count={4} active={0} align="left" />
        </View>
        <PrimaryButton label="Get Started" circle="left" onPress={() => router.push('/onboarding/find-people')} />
      </View>
    </View>
  );
}

function Feature({ label, icon, bg }: { label: string; icon: React.ReactNode; bg: string }) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.heroSky, overflow: 'hidden' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: s(34),
    borderTopRightRadius: s(34),
    paddingHorizontal: H_PAD,
    paddingTop: s(36),
  },
  livePill: {
    position: 'absolute',
    left: H_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: BORDER * 1.4,
    borderColor: colors.ink,
    borderRadius: s(24),
    height: s(46),
    paddingHorizontal: s(14),
  },
  liveCity: { fontFamily: fonts.display, fontSize: s(16), color: colors.ink, marginLeft: s(8), marginTop: s(2) },
  liveDot: { width: s(7), height: s(7), borderRadius: s(4), backgroundColor: colors.green, marginLeft: s(10) },
  liveText: { fontFamily: fonts.displayBold, fontSize: s(16), color: colors.green, marginLeft: s(6), marginTop: s(2) },
  features: { flexDirection: 'row', alignItems: 'center', paddingVertical: s(16) },
  feature: { flex: 1, alignItems: 'center' },
  featureIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(8),
  },
  featureText: { fontFamily: fonts.displayBold, fontSize: s(15.5), color: colors.ink },
  vr: { width: s(1.5), height: s(36), backgroundColor: colors.divider },
  xBox: {
    width: s(15),
    height: s(15),
    borderRadius: s(3),
    borderWidth: s(1.6),
    borderColor: colors.peachIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
