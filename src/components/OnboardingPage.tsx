import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { H_PAD, s } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { PrimaryButton } from './Buttons';
import { Dots } from './Controls';
import { Heading, HeadingPart } from './Heading';
import { BrandHeader, Footer, Screen } from './Layout';

type Props = {
  step: 1 | 2 | 3;
  heading: HeadingPart[];
  subtitle: string;
  cta: string;
  onNext: () => void;
  children: React.ReactNode;
  background?: React.ReactNode;
};

export function OnboardingPage({ step, heading, subtitle, cta, onNext, children, background }: Props) {
  const router = useRouter();
  return (
    <Screen>
      {background}
      <BrandHeader onSkip={() => router.replace('/auth/phone')} />
      <View style={styles.head}>
        <Heading parts={heading} />
        <Text style={[t.subtitle, { marginTop: s(8), maxWidth: s(330) }]}>{subtitle}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <View style={{ marginTop: s(18) }}>
        <Dots count={4} active={step} />
      </View>
      <Footer style={{ paddingTop: s(20) }}>
        <PrimaryButton label={cta} onPress={onNext} />
      </Footer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: H_PAD, paddingTop: s(28) },
  body: { flex: 1, paddingHorizontal: H_PAD, marginTop: s(20) },
});
