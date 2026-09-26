import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../src/components/Buttons';
import { Checkbox } from '../../src/components/Controls';
import { Heading } from '../../src/components/Heading';
import { Lock } from '../../src/components/icons';
import { Divider, Footer, HeaderRow, Screen, SoftCard } from '../../src/components/Layout';
import { colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

/** 09 · Age + terms + guidelines consent. All three are required. */
export default function Consent() {
  const router = useRouter();
  const [checks, setChecks] = useState([false, false, false]);
  const toggle = (i: number) => setChecks((c) => c.map((v, j) => (j === i ? !v : v)));
  const all = checks.every(Boolean);

  const Link = ({ label, href }: { label: string; href: string }) => (
    <Text style={styles.link} onPress={() => router.push(href as never)}>
      {label}
    </Text>
  );

  return (
    <Screen>
      <HeaderRow />
      <View style={styles.content}>
        <Heading parts={['One', { accent: 'quick check', squiggle: 'lime' }, 'before you join']} />
        <Text style={[t.subtitle, { marginTop: s(8) }]}>
          Vyaparhood is a space for verified business owners — a few essentials first.
        </Text>

        <SoftCard radius={s(26)} style={{ marginTop: s(28) }} innerStyle={{ paddingHorizontal: s(20), paddingVertical: s(8) }}>
          <Row checked={checks[0]} onPress={() => toggle(0)}>
            <Text style={styles.rowText}>I'm 18 years of age or older</Text>
          </Row>
          <Divider />
          <Row checked={checks[1]} onPress={() => toggle(1)}>
            <Text style={styles.rowText}>
              I agree to the <Link label="Terms of Service" href="/legal/terms" /> and{' '}
              <Link label="Privacy Policy" href="/legal/privacy" />
            </Text>
          </Row>
          <Divider />
          <Row checked={checks[2]} onPress={() => toggle(2)}>
            <Text style={styles.rowText}>
              I agree to follow the <Link label="Community Guidelines" href="/legal/guidelines" />
            </Text>
          </Row>
        </SoftCard>

        <View style={styles.note}>
          <Lock size={s(15)} color={colors.textMuted} strokeWidth={2} />
          <Text style={[t.helper, { fontSize: s(13.5), marginLeft: s(8), flex: 1 }]}>
            Required by Google Play & App Store policy for community apps.
          </Text>
        </View>
      </View>
      <Footer>
        <PrimaryButton label="Agree & Continue" onPress={() => router.push('/auth/city')} disabled={!all} />
      </Footer>
    </Screen>
  );
}

function Row({ checked, onPress, children }: { checked: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <Checkbox checked={checked} />
      <View style={{ flex: 1, marginLeft: s(14) }}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: H_PAD, paddingTop: s(26) },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: s(14) },
  rowText: { fontFamily: fonts.bodyBold, fontSize: s(16), lineHeight: s(23), color: colors.ink },
  link: { color: colors.blue, textDecorationLine: 'underline' },
  note: { flexDirection: 'row', alignItems: 'flex-start', marginTop: s(16) },
});
