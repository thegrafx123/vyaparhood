import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Hatched } from '../../src/components/Hatched';
import { Check, Mail } from '../../src/components/icons';
import { OnboardingPage } from '../../src/components/OnboardingPage';
import { ShadowBox } from '../../src/components/ShadowBox';
import { BORDER, colors, fonts, s } from '../../src/theme/tokens';

export default function ContextNotColdDms() {
  const router = useRouter();
  return (
    <OnboardingPage
      step={2}
      heading={['Connect with context,', { accent: 'not cold DMs', squiggle: 'lime' }]}
      subtitle="Add a short note with every request. Chat unlocks once they say yes."
      cta="Next"
      onNext={() => router.push('/onboarding/why')}
    >
      <View style={{ paddingTop: s(18) }}>
        <ShadowBox radius={s(28)}>
          <View style={styles.card}>
            <View style={styles.row}>
              <Hatched radius={s(12)} iconSize={s(15)} style={{ width: s(40), height: s(40) }} />
              <View style={{ marginLeft: s(12) }}>
                <Text style={styles.small}>Sending a request to</Text>
                <Text style={styles.name}>Riya Sharma</Text>
              </View>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteText}>"Hi, I run a small cafe and would love to collaborate on branding."</Text>
            </View>
          </View>
        </ShadowBox>

        <ShadowBox radius={s(18)} offset={{ x: s(4), y: s(5) }} style={styles.pillWrap}>
          <View style={styles.pill}>
            <View style={styles.pillIcon}>
              <Mail size={s(14)} color={colors.blue} strokeWidth={2.2} />
            </View>
            <Text style={styles.pillText}>No cold DMs</Text>
          </View>
        </ShadowBox>

        <View style={styles.approved}>
          <View style={styles.approvedIcon}>
            <Check size={s(14)} color={colors.ink} strokeWidth={3} />
          </View>
          <Text style={styles.approvedText}>Connection approved — you can chat now</Text>
        </View>
      </View>
    </OnboardingPage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: s(28),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: s(18),
    paddingTop: s(22),
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  small: { fontFamily: fonts.body, fontSize: s(13.5), color: colors.textMuted },
  name: { fontFamily: fonts.display, fontSize: s(17), color: colors.ink, marginTop: -s(1) },
  note: { backgroundColor: '#F1F5FD', borderRadius: s(16), padding: s(14), marginTop: s(16) },
  noteText: { fontFamily: fonts.body, fontSize: s(15.5), lineHeight: s(22), color: colors.ink },
  pillWrap: { position: 'absolute', top: 0, right: -s(4) },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: s(18),
    borderWidth: BORDER,
    borderColor: colors.ink,
    height: s(40),
    paddingHorizontal: s(10),
  },
  pillIcon: {
    width: s(24),
    height: s(24),
    borderRadius: s(7),
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(8),
  },
  pillText: { fontFamily: fonts.bodyBold, fontSize: s(15), color: colors.ink },
  approved: {
    marginTop: s(20),
    backgroundColor: colors.ink,
    borderRadius: s(24),
    height: s(52),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
  },
  approvedIcon: {
    width: s(25),
    height: s(25),
    borderRadius: s(13),
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  approvedText: { fontFamily: fonts.bodyBold, fontSize: s(15.5), color: colors.white, flexShrink: 1 },
});
