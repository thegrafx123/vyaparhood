import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TextInputInstance, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { OTP_LENGTH, OTP_RESEND_SECONDS } from '../../src/config';
import { refreshLiveLocation } from '../../src/lib/liveLocation';
import { resetTo, routeForMe } from '../../src/lib/routing';
import { FadeUp, Pop } from '../../src/motion';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, H_PAD, s, shadow } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { digitsOnly, isValidEmail } from '../../src/utils/validation';
import { CtaButton, TextButton } from '../../src/ui/Buttons';
import { Helper } from '../../src/ui/Form';
import { BackButton, Brand } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Lock, Mail } from '../../src/ui/icons';
import { Footer, KeyboardArea, Screen } from '../../src/ui/Screen';

/**
 * 6 + 7 · Email and OTP on one page. Enter the email, tap "Get OTP",
 * and the 6-digit code boxes pop in underneath.
 */
export default function EmailLogin() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { refreshMe } = useAuth();
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const address = email.trim().toLowerCase();
  const emailOk = isValidEmail(address);

  const sendCode = async () => {
    if (!emailOk) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.auth.sendCode(address);
      setStage('code');
      setCode('');
      setResendIn(OTP_RESEND_SECONDS);
      setTimeout(() => codeRef.current?.focus(), 350);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.auth.verifyCode(address, value);
      if (state.live.status === 'granted') refreshLiveLocation({ signedIn: true, onFix: actions.setLive });
      const me = await refreshMe();
      resetTo(router, routeForMe(me, state.flags));
    } catch (e) {
      setError(friendlyError(e));
      setCode('');
      setBusy(false);
    }
  };

  const onCode = (v: string) => {
    const next = digitsOnly(v).slice(0, OTP_LENGTH);
    setCode(next);
    if (error) setError(null);
    if (next.length === OTP_LENGTH) verify(next);
  };

  return (
    <Screen texture>
      <KeyboardArea>
        <FadeUp delay={20} style={{ flexDirection: 'row', alignItems: 'center', gap: s(14), paddingHorizontal: s(24), paddingTop: s(22) }}>
          <BackButton />
          <Brand size={s(28)} textSize={s(14)} />
        </FadeUp>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <FadeUp delay={100} style={{ paddingHorizontal: H_PAD, paddingTop: s(26) }}>
            <AccentHeading parts={["Let's get you", { accent: 'verified', drawDelay: 500 }]} size={30} accentSize={36} />
            <Text style={[t.subtitle, { fontSize: s(14), marginTop: s(12) }]}>
              {stage === 'email'
                ? 'Sign up in seconds — no GST or mandatory documents required.'
                : `Enter the ${OTP_LENGTH}-digit code we just sent to ${address}.`}
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
                  paddingRight: s(12),
                  paddingVertical: s(2),
                  borderRightWidth: s(2),
                  borderRightColor: colors.line,
                }}
              >
                <Mail size={s(17)} color={colors.blue} />
              </View>
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v.replace(/\s/g, ''));
                  if (error) setError(null);
                }}
                editable={stage === 'email' && !busy}
                placeholder="you@email.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={254}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={sendCode}
                accessibilityLabel="Email address\"
                style={{
                  flex: 1,
                  paddingLeft: s(12),
                  paddingVertical: s(14),
                  fontFamily: fonts.bodySemi,
                  fontSize: s(15),
                  letterSpacing: 0.5,
                  color: stage === 'code' ? colors.text : colors.ink,
                }}
              />
              {stage === 'code' && (
                <TextButton
                  label="Edit"
                  onPress={() => {
                    setStage('email');
                    setCode('');
                    setError(null);
                  }}
                />
              )}
            </View>
            {stage === 'email' && (
              <Text style={{ fontFamily: fonts.body, fontSize: s(12.5), color: colors.muted, marginTop: s(10) }}>
                We'll email you a verification code.
              </Text>
            )}
          </FadeUp>

          {stage === 'code' && (
            <View style={{ paddingHorizontal: H_PAD, paddingTop: s(26) }}>
              <FadeUp delay={60}>
                <Text style={[t.label, { marginBottom: s(10) }]}>Verification code</Text>
              </FadeUp>
              <Pressable onPress={() => codeRef.current?.focus()} accessibilityLabel="Verification code">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const char = code[i];
                    const active = i === Math.min(code.length, OTP_LENGTH - 1);
                    return (
                      <Pop key={i} from={0.7} peak={1.06} delay={150 + i * 50}>
                        <View
                          style={{
                            width: s(46),
                            height: s(58),
                            borderRadius: s(16),
                            backgroundColor: colors.white,
                            borderWidth: s(2.5),
                            borderColor: active ? colors.blue : colors.ink,
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: active ? shadow.card : undefined,
                          }}
                        >
                          <Text style={{ fontFamily: fonts.display, fontSize: s(24), color: char ? colors.ink : colors.placeholder, marginTop: s(3) }}>
                            {char ?? '·'}
                          </Text>
                        </View>
                      </Pop>
                    );
                  })}
                </View>
              </Pressable>
              <TextInput
                ref={codeRef}
                value={code}
                onChangeText={onCode}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                caretHidden
              />
              <FadeUp delay={380} style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(18) }}>
                <Text style={{ fontFamily: fonts.body, fontSize: s(13), color: colors.muted }}>Didn't get it? Check spam, or </Text>
                {resendIn > 0 ? (
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(13), color: colors.blue }}>
                    Resend in {Math.floor(resendIn / 60)}:{String(resendIn % 60).padStart(2, '0')}
                  </Text>
                ) : (
                  <TextButton label="Resend code" onPress={sendCode} />
                )}
              </FadeUp>
            </View>
          )}

          {error ? (
            <View style={{ paddingHorizontal: H_PAD }}>
              <Helper error>{error}</Helper>
            </View>
          ) : null}

          <View style={{ flex: 1, minHeight: s(20) }} />

          <FadeUp delay={300} style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: H_PAD }}>
            <Lock size={s(14)} color={colors.muted} />
            <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted, flex: 1, lineHeight: s(16) }}>
              Your email stays private — other members never see it.
            </Text>
          </FadeUp>

          <FadeUp delay={400}>
            <Footer style={{ paddingTop: s(14) }}>
              {stage === 'email' ? (
                <CtaButton label="Get OTP" onPress={sendCode} loading={busy} disabled={!emailOk} />
              ) : (
                <CtaButton label="Verify" onPress={() => verify()} loading={busy} disabled={code.length !== OTP_LENGTH} />
              )}
            </Footer>
          </FadeUp>
        </ScrollView>
      </KeyboardArea>
    </Screen>
  );
}
