import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PrimaryButton } from '../../src/components/Buttons';
import { Heading } from '../../src/components/Heading';
import { ShieldCheck } from '../../src/components/icons';
import { Blob, Footer, Screen } from '../../src/components/Layout';
import { ShadowBox } from '../../src/components/ShadowBox';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

/** 13 · Under review. */
export default function UnderReview() {
  const router = useRouter();
  const box = s(114);
  return (
    <Screen>
      <Blob color={colors.blobReview} size={s(300)} top={-s(140)} left={-s(140)} />
      <View style={styles.center}>
        <ShadowBox radius={s(32)} color={colors.shadowSoft} offset={{ x: s(4), y: s(5) }}>
          <View style={[styles.box, { width: box, height: box }]}>
            <View style={styles.ringWrap}>
              <Svg width={s(40)} height={s(40)}>
                <Circle cx={s(20)} cy={s(20)} r={s(18)} stroke="#8C98B8" strokeWidth={s(3)} strokeDasharray={`${s(6)} ${s(4)}`} fill="none" />
              </Svg>
              <View style={StyleSheet.absoluteFill}>
                <View style={styles.shield}>
                  <ShieldCheck size={s(22)} color={colors.lime} strokeWidth={2.3} />
                </View>
              </View>
            </View>
          </View>
        </ShadowBox>

        <Heading
          parts={["We're", { accent: 'reviewing', squiggle: false }, 'your details']}
          align="center"
          size={s(29)}
          style={{ marginTop: s(40) }}
        />
        <Text style={[t.subtitle, styles.body]}>
          Most profiles are verified within 24 hours. We'll notify you the moment you're approved — feel free to
          explore Vyaparhood in the meantime.
        </Text>
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>🔒  Verified only</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>⏱  ~24 hr review</Text>
          </View>
        </View>
      </View>
      <Footer>
        <PrimaryButton label="Continue" onPress={() => router.push('/auth/notifications')} />
      </Footer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: H_PAD },
  box: { borderRadius: s(32), backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  ringWrap: { width: s(40), height: s(40) },
  shield: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { textAlign: 'center', marginTop: s(12), fontSize: s(16), lineHeight: s(24) },
  pills: { flexDirection: 'row', gap: s(12), marginTop: s(26) },
  pill: {
    height: s(38),
    borderRadius: s(19),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: s(16),
    justifyContent: 'center',
  },
  pillText: { fontFamily: fonts.bodyBold, fontSize: s(15), color: colors.ink },
});
