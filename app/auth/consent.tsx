import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { routeForMe } from '../../src/lib/routing';
import { FadeUp } from '../../src/motion';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { CtaButton } from '../../src/ui/Buttons';
import { Checkbox, Helper } from '../../src/ui/Form';
import { BackButton } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Lock } from '../../src/ui/icons';
import { Footer, Screen } from '../../src/ui/Screen';

type Key = 'age' | 'terms' | 'guidelines';

/** 8 · Age & consent. Each box must be ticked by the member. */
export default function Consent() {
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { state } = useApp();
  const [checked, setChecked] = useState<Record<Key, boolean>>({ age: false, terms: false, guidelines: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const all = checked.age && checked.terms && checked.guidelines;

  const toggle = (k: Key) => setChecked((c) => ({ ...c, [k]: !c[k] }));

  const agree = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.me.update({ consented_at: new Date().toISOString() });
      const me = await refreshMe();
      router.replace(routeForMe(me, state.flags) as never);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  const signOut = async () => {
    await api.auth.signOut();
    router.replace('/welcome');
  };

  const link = (label: string, href: string) => (
    <Text
      accessibilityRole="link"
      suppressHighlighting
      onPress={() => router.push(href as never)}
      style={{ color: colors.blue, textDecorationLine: 'underline' }}
    >
      {label}
    </Text>
  );

  const rows: { key: Key; label: string; body: React.ReactNode }[] = [
    { key: 'age', label: "I'm 18 years of age or older", body: "I'm 18 years of age or older" },
    {
      key: 'terms',
      label: 'I agree to the Terms of Service and Privacy Policy',
      body: <>I agree to the {link('Terms of Service', '/legal/terms')} and {link('Privacy Policy', '/legal/privacy')}</>,
    },
    {
      key: 'guidelines',
      label: 'I agree to follow the Community Guidelines',
      body: <>I agree to follow the {link('Community Guidelines', '/legal/guidelines')}</>,
    },
  ];

  return (
    <Screen texture>
      <FadeUp delay={20} style={{ paddingHorizontal: s(24), paddingTop: s(22), flexDirection: 'row' }}>
        <BackButton onPress={signOut} />
      </FadeUp>

      <FadeUp delay={80} style={{ paddingHorizontal: H_PAD, paddingTop: s(24) }}>
        <AccentHeading parts={['One', { accent: 'quick check', drawDelay: 500 }, 'before you join']} size={28} accentSize={34} />
        <Text style={[t.subtitle, { marginTop: s(10) }]}>
          Vyaparhood is a space for verified business owners — a few essentials first.
        </Text>
      </FadeUp>

      <FadeUp delay={180} style={{ marginHorizontal: H_PAD, marginTop: s(22) }}>
        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: s(2.5),
            borderColor: colors.ink,
            borderRadius: s(20),
            paddingHorizontal: s(18),
            paddingVertical: s(4),
            boxShadow: `${s(4)}px ${s(5)}px 0px rgba(22,35,63,0.15)`,
          }}
        >
          {rows.map((r, i) => (
            <View
              key={r.key}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: s(12),
                paddingVertical: s(13),
                borderBottomWidth: i < rows.length - 1 ? s(2) : 0,
                borderBottomColor: colors.line,
              }}
            >
              {/* Box and text are separate so the links inside the text stay reachable. */}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={r.label}
                accessibilityState={{ checked: checked[r.key] }}
                onPress={() => toggle(r.key)}
                hitSlop={10}
                style={{ marginTop: s(1) }}
              >
                <Checkbox checked={checked[r.key]} />
              </Pressable>
              <Text
                onPress={() => toggle(r.key)}
                suppressHighlighting
                style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: s(13.5), lineHeight: s(20), color: colors.ink }}
              >
                {r.body}
              </Text>
            </View>
          ))}
        </View>
      </FadeUp>

      <FadeUp delay={460} style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginHorizontal: H_PAD, marginTop: s(14) }}>
        <Lock size={s(14)} color={colors.muted} />
        <Text style={{ fontFamily: fonts.body, fontSize: s(11), lineHeight: s(15), color: colors.muted, flex: 1 }}>
          {'Required by Google Play & App Store policy for community apps.'}
        </Text>
      </FadeUp>
      {error ? (
        <View style={{ paddingHorizontal: H_PAD }}>
          <Helper error>{error}</Helper>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />
      <FadeUp delay={520}>
        <Footer>
          <CtaButton label="Agree & Continue" onPress={agree} disabled={!all} loading={busy} />
        </Footer>
      </FadeUp>
    </Screen>
  );
}
