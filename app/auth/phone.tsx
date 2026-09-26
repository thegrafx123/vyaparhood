import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../src/components/Buttons';
import { Heading } from '../../src/components/Heading';
import { Hatched } from '../../src/components/Hatched';
import { ChevronDown } from '../../src/components/icons';
import { BrandHeader, Footer, KeyboardArea, Screen } from '../../src/components/Layout';
import { ShadowBox } from '../../src/components/ShadowBox';
import { useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { digitsOnly, formatPhone, isValidPhone } from '../../src/utils/validation';

/** 07 · Phone number. */
export default function Phone() {
  const router = useRouter();
  const { state, actions } = useApp();
  const [phone, setPhone] = useState(formatPhone(state.phone));
  const valid = isValidPhone(phone);

  const onSend = () => {
    actions.patch({ phone: digitsOnly(phone) });
    // Backend later: POST /auth/otp { phone } (rate-limited, SMS via DLT route)
    router.push('/auth/otp');
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
              <Text style={styles.cc}>+91</Text>
              <ChevronDown size={s(15)} color={colors.text} strokeWidth={2.2} />
              <View style={styles.sep} />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(formatPhone(v))}
                placeholder="98765 43210"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={11}
                style={styles.input}
                accessibilityLabel="Mobile number"
              />
            </View>
          </ShadowBox>
          <Text style={[t.helper, { fontSize: s(13.5), marginTop: s(10) }]}>
            We'll send you a verification code by SMS.
          </Text>

          {/* Design placeholder — replace with the sign-up illustration when ready. */}
          <Hatched radius={s(28)} label="PHOTO GOES HERE" iconSize={s(30)} style={styles.photo} />
        </View>
        <Footer>
          <PrimaryButton label="Send OTP" onPress={onSend} disabled={!valid} />
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
  cc: { fontFamily: fonts.bodyBold, fontSize: s(17), color: colors.ink, marginRight: s(6) },
  sep: { width: s(2), height: s(26), backgroundColor: colors.divider, marginHorizontal: s(14) },
  input: { flex: 1, fontFamily: fonts.bodyBold, fontSize: s(18), color: colors.ink, paddingVertical: 0 },
  photo: { flex: 1, marginTop: s(26), minHeight: s(140) },
});
