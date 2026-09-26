import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Hatched } from '../../src/components/Hatched';
import { OnboardingPage } from '../../src/components/OnboardingPage';
import { ShadowBox } from '../../src/components/ShadowBox';
import { BORDER, colors, fonts, s, SOFT_SHADOW } from '../../src/theme/tokens';

const MEERA = require('../../assets/images/avatar-meera.png');
const ROHAN = require('../../assets/images/avatar-rohan.png');
const ARJUN = require('../../assets/images/avatar-arjun.png');

export default function FindPeople() {
  const router = useRouter();
  return (
    <OnboardingPage
      step={1}
      heading={['Find the right people in your', { accent: 'city', squiggle: 'lime' }]}
      subtitle="See who's building what — right around you, or across the city."
      cta="Next"
      onNext={() => router.push('/onboarding/context')}
    >
      <View style={{ flex: 1, paddingRight: s(6), paddingBottom: s(6) }}>
        <ShadowBox radius={s(30)} color={colors.shadowSoft} offset={SOFT_SHADOW} style={{ flex: 1 }}>
          <View style={styles.card}>
            {/* Swap this placeholder for the real "business owner nearby" photo once available. */}
            <Hatched radius={s(28)} dashed={false} style={StyleSheet.absoluteFill} iconSize={s(28)} />
          </View>
        </ShadowBox>
        <PersonChip source={MEERA} name="Meera" role="Graphic Designer" style={{ position: 'absolute', top: s(10), right: -s(10) }} />
        <PersonChip source={ROHAN} name="Rohan" role="Cafe Owner" style={{ position: 'absolute', top: '64%', left: -s(10) }} />
        <PersonChip source={ARJUN} name="Arjun" role="Fitness Trainer" style={{ position: 'absolute', bottom: -s(2), right: s(6) }} />
      </View>
    </OnboardingPage>
  );
}

function PersonChip({
  source,
  name,
  role,
  style,
}: {
  source: ImageSourcePropType;
  name: string;
  role: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ShadowBox radius={s(18)} style={style}>
      <View style={styles.chip}>
        <Image source={source} style={styles.chipAvatar} />
        <View style={{ marginLeft: s(10), marginRight: s(8) }}>
          <Text style={styles.chipName}>{name}</Text>
          <Text style={styles.chipRole}>{role}</Text>
        </View>
      </View>
    </ShadowBox>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: s(30),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: s(18),
    borderWidth: BORDER,
    borderColor: colors.ink,
    padding: s(6),
    paddingRight: s(8),
  },
  chipAvatar: { width: s(38), height: s(38), borderRadius: s(10) },
  chipName: { fontFamily: fonts.display, fontSize: s(15.5), color: colors.ink, lineHeight: s(20) },
  chipRole: { fontFamily: fonts.body, fontSize: s(13.5), color: colors.text, lineHeight: s(18) },
});
