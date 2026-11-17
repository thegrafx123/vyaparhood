import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { resetTo, routeForMe } from '../../src/lib/routing';
import { FadeUp } from '../../src/motion';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, H_PAD, s, shadow } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { digitsOnly, formatPhone, isValidPhone } from '../../src/utils/validation';
import { CtaButton } from '../../src/ui/Buttons';
import { Helper } from '../../src/ui/Form';
import { Brand } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { ChevronDown, Lock } from '../../src/ui/icons';
import { Footer, KeyboardArea, Screen } from '../../src/ui/Screen';

/**
 * Mobile number, asked once right after a new member's first email
 * login. Saved to their profile; not verified by OTP.
 */
export default function PhoneNumber() {
  const router = useRouter();
  const { state } = useApp();
  const { refreshMe } = useAuth();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = digitsOnly(phone);
  const phoneOk = isValidPhone(digits);

  const save = async () => {
    if (!phoneOk) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.me.setPhone(digits);
      const me = await refreshMe();
      resetTo(router, routeForMe(me, state.flags));
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Screen texture>
      <KeyboardArea>
        <FadeUp delay={20} style={{ flexDirection: 'row', alignItems: 'center', gap: s(14), paddingHorizontal: s(24), paddingTop: s(22) }}>
          <Brand size={s(28)} textSize={s(14)} />
        </FadeUp>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <FadeUp delay={100} style={{ paddingHorizontal: H_PAD, paddingTop: s(26) }}>
            <AccentHeading parts={["What's your", { accent: 'number', drawDelay: 500, suffix: '?' }]} size={30} accentSize={36} />
            <Text style={[t.subtitle, { fontSize: s(14), marginTop: s(12) }]}>
              So we can reach you about your account and membership.
            </Text>
          </FadeUp>

          <FadeUp delay={200} style={{ paddingHorizontal: H_PAD, paddingTop: s(24) }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.white,
                borderWidth: s(2.5),
                borderColor: colors.ink,
                borderRadius: s(18),
                paddingHorizontal: s(16),
                boxShadow: shadow.card,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: s(6),
                  paddingRight: s(12),
                  borderRightWidth: s(2),
                  borderRightColor: colors.line,
                }}
              >
                <Text style={{ fontFamily: fonts.displayBold, fontSize: s(15), color: colors.ink, marginTop: s(2) }}>+91</Text>
                <ChevronDown size={s(11)} color={colors.text} />
              </View>
              <TextInput
                value={formatPhone(phone)}
                onChangeText={(v) => {
                  setPhone(digitsOnly(v).slice(0, 10));
                  if (error) setError(null);
                }}
                editable={!busy}
                placeholder="98765 43210"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={11}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={save}
                accessibilityLabel="Mobile number"
                style={{
                  flex: 1,
                  paddingLeft: s(12),
                  paddingVertical: s(14),
                  fontFamily: fonts.bodySemi,
                  fontSize: s(15),
                  letterSpacing: 0.5,
                  color: colors.ink,
                }}
              />
            </View>
          </FadeUp>

          {error ? (
            <View style={{ paddingHorizontal: H_PAD }}>
              <Helper error>{error}</Helper>
            </View>
          ) : null}

          <View style={{ flex: 1, minHeight: s(20) }} />

          <FadeUp delay={300} style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: H_PAD }}>
            <Lock size={s(14)} color={colors.muted} />
            <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted, flex: 1, lineHeight: s(16) }}>
              Your number stays private — other members never see it.
            </Text>
          </FadeUp>

          <FadeUp delay={400}>
            <Footer style={{ paddingTop: s(14) }}>
              <CtaButton label="Continue" onPress={save} loading={busy} disabled={!phoneOk} />
            </Footer>
          </FadeUp>
        </ScrollView>
      </KeyboardArea>
    </Screen>
  );
}
