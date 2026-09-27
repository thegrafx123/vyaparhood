import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { PrimaryButton } from '../../src/components/Buttons';
import { Hatched } from '../../src/components/Hatched';
import { Heading } from '../../src/components/Heading';
import { Mail } from '../../src/components/icons';
import { BrandHeader, Footer, KeyboardArea, Screen } from '../../src/components/Layout';
import { ShadowBox } from '../../src/components/ShadowBox';
import { OTP_LENGTH } from '../../src/config';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { isValidEmail } from '../../src/utils/validation';

/** 07 · Email sign-in (was phone in the design; SMS OTP comes later). */
export default function EmailSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const valid = isValidEmail(email);

  const onSend = async () => {
    setSending(true);
    try {
      await api.auth.sendEmailCode(email);
      router.push({ pathname: '/auth/otp', params: { email: email.trim().toLowerCase() } });
    } catch (e) {
      Alert.alert("Couldn't send the code", friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <KeyboardArea>
        <BrandHeader back />
        <View style={styles.content}>
          <Heading parts={["Let's get you", { accent: 'verified', squiggle: 'lime' }]} />
          <Text style={[t.subtitle, { marginTop: s(8) }]}>
            Sign up in seconds — no GST or mandatory documents required.
          </Text>

          <ShadowBox radius={s(26)} offset={{ x: s(4), y: s(5) }} style={{ marginTop: s(26) }}>
            <View style={styles.field}>
              <Mail size={s(20)} color={colors.blue} strokeWidth={2.1} />
              <View style={styles.sep} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                accessibilityLabel="Email address"
                returnKeyType="send"
                onSubmitEditing={() => valid && !sending && onSend()}
              />
            </View>
          </ShadowBox>
          <Text style={[t.helper, { fontSize: s(13.5), marginTop: s(10) }]}>
            We'll email you a {OTP_LENGTH}-digit verification code.
          </Text>

          <Hatched radius={s(28)} label="PHOTO GOES HERE" iconSize={s(30)} style={styles.photo} />
        </View>
        <Footer>
          <PrimaryButton label="Send code" onPress={onSend} disabled={!valid} loading={sending} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: H_PAD, paddingTop: s(30) },
  field: {
    height: s(54),
    borderRadius: s(26),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  sep: { width: s(2), height: s(26), backgroundColor: colors.divider, marginHorizontal: s(14) },
  input: { flex: 1, fontFamily: fonts.bodyBold, fontSize: s(17), color: colors.ink, paddingVertical: 0 },
  photo: { flex: 1, marginTop: s(26), minHeight: s(140) },
});
