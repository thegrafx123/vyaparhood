import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { routeForMe } from '../../src/lib/routing';
import { syncLocation } from '../../src/lib/syncLocation';
import { useAuth } from '../../src/state/AuthProvider';
import { PrimaryButton } from '../../src/components/Buttons';
import { Heading } from '../../src/components/Heading';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../../src/components/Layout';
import { ShadowBox } from '../../src/components/ShadowBox';
import { OTP_LENGTH, OTP_RESEND_SECONDS } from '../../src/config';
import { useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { digitsOnly } from '../../src/utils/validation';

/** 08 · Email OTP (Supabase Auth). */
export default function Otp() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { state } = useApp();
  const { refreshMe } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const complete = code.length === OTP_LENGTH;

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH || verifying) return;
    setVerifying(true);
    try {
      await api.auth.verifyEmailCode(String(email), value);
      await syncLocation(state.location);
      const me = await refreshMe();
      router.replace(routeForMe(me) as never);
    } catch (e) {
      setCode('');
      Alert.alert("That didn't work", friendlyError(e));
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    try {
      await api.auth.sendEmailCode(String(email));
      setSeconds(OTP_RESEND_SECONDS);
      setCode('');
    } catch (e) {
      Alert.alert("Couldn't resend", friendlyError(e));
    }
  };

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow />
        <View style={styles.content}>
          <Heading parts={['Enter the code we', { accent: 'just sent', squiggle: 'lime' }, 'you']} />
          <Text style={[t.subtitle, { marginTop: s(8) }]}>
            We emailed a {OTP_LENGTH}-digit code to <Text style={styles.bold}>{email}</Text>
          </Text>

          <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()} accessibilityLabel="Enter code">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const digit = code[i];
              const active = i === Math.min(code.length, OTP_LENGTH - 1);
              const box = (
                <View style={[styles.box, active && styles.boxActive]}>
                  {digit ? <Text style={styles.digit}>{digit}</Text> : <View style={styles.empty} />}
                </View>
              );
              return (
                <View key={i} style={{ marginRight: i < OTP_LENGTH - 1 ? s(8) : 0 }}>
                  {active ? (
                    <ShadowBox radius={s(15)} offset={{ x: s(3), y: s(4) }}>
                      {box}
                    </ShadowBox>
                  ) : (
                    box
                  )}
                </View>
              );
            })}
          </Pressable>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => {
              const next = digitsOnly(v).slice(0, OTP_LENGTH);
              setCode(next);
              if (next.length === OTP_LENGTH) verify(next);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
            maxLength={OTP_LENGTH}
            style={styles.hidden}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't get it? Check spam, or </Text>
            <Pressable
              disabled={seconds > 0}
              onPress={resend}
            >
              <Text style={styles.resend}>
                {seconds > 0 ? `Resend in ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}` : 'Resend code'}
              </Text>
            </Pressable>
          </View>
        </View>
        <Footer>
          <PrimaryButton label="Verify" onPress={() => verify()} disabled={!complete} loading={verifying} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

const BOX_W = s(46);
const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: H_PAD, paddingTop: s(26) },
  bold: { fontFamily: fonts.bodyBold, color: colors.ink },
  boxes: { flexDirection: 'row', marginTop: s(26) },
  box: {
    width: BOX_W,
    height: s(60),
    borderRadius: s(15),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.blue, borderWidth: s(2.2) },
  digit: { fontFamily: fonts.display, fontSize: s(24), color: colors.ink, marginTop: s(3) },
  empty: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: '#C1CAE0' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  resendRow: { flexDirection: 'row', marginTop: s(20), alignItems: 'center' },
  resendLabel: { fontFamily: fonts.body, fontSize: s(14.5), color: colors.textMuted },
  resend: { fontFamily: fonts.bodyBold, fontSize: s(14.5), color: colors.blue },
});
