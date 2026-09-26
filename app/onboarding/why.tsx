import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Coffee, ShieldCheck, Target } from '../../src/components/icons';
import { Blob } from '../../src/components/Layout';
import { OnboardingPage } from '../../src/components/OnboardingPage';
import { BORDER, colors, fonts, s } from '../../src/theme/tokens';

const POINTS = [
  {
    title: 'Verified, real people',
    body: 'Every member proves who they are before they can join.',
    bg: colors.tealSoft,
    Icon: ShieldCheck,
    color: colors.teal,
  },
  {
    title: 'Matched to what you need',
    body: 'Filter by category and intent — not endless swiping.',
    bg: colors.blueSoft,
    Icon: Target,
    color: colors.blue,
  },
  {
    title: 'Built for real meetups',
    body: 'From a first chat to coffee down the street.',
    bg: colors.orangeSoft,
    Icon: Coffee,
    color: colors.peachIcon,
  },
];

export default function NotAnotherApp() {
  const router = useRouter();
  return (
    <OnboardingPage
      step={3}
      heading={['Not another', { accent: 'networking', squiggle: 'ink' }, 'app']}
      subtitle="Here's what makes finding the right people simple."
      cta="Let's Go"
      onNext={() => router.push('/auth/phone')}
      background={<Blob color={colors.blobLime} size={s(250)} top={-s(80)} right={-s(60)} />}
    >
      <View style={styles.timeline}>
        <View style={styles.line} />
        {POINTS.map(({ title, body, bg, Icon, color }) => (
          <View key={title} style={styles.item}>
            <View style={[styles.icon, { backgroundColor: bg }]}>
              <Icon size={s(21)} color={color} strokeWidth={2.1} />
            </View>
            <View style={styles.texts}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingPage>
  );
}

const ICON = s(46);

const styles = StyleSheet.create({
  timeline: { flex: 1, paddingTop: s(4) },
  line: {
    position: 'absolute',
    left: ICON / 2 - s(1.5),
    top: s(10),
    bottom: 0,
    width: s(3),
    borderRadius: s(2),
    backgroundColor: colors.blueSoft,
  },
  item: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: s(34) },
  icon: {
    width: ICON,
    height: ICON,
    borderRadius: s(13),
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, marginLeft: s(16), paddingTop: s(4) },
  title: { fontFamily: fonts.display, fontSize: s(17.5), color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: s(15), lineHeight: s(21), color: colors.text, marginTop: s(2) },
});
