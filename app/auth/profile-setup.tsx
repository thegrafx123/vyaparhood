import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../src/components/Buttons';
import { Chip, TextField } from '../../src/components/Controls';
import { Hatched } from '../../src/components/Hatched';
import { AtSign, Calendar, Camera, Mail } from '../../src/components/icons';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../../src/components/Layout';
import { CATEGORIES } from '../../src/config';
import { useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { pickProfilePhoto } from '../../src/utils/media';
import { checkDob, formatDob, isValidEmail } from '../../src/utils/validation';

/** 11 · Profile setup. */
export default function ProfileSetup() {
  const router = useRouter();
  const { state, actions } = useApp();
  const p = state.profile;
  const [showErrors, setShowErrors] = useState(false);

  const dob = checkDob(p.dob);
  const errors = {
    name: p.name.trim().length >= 2 ? null : 'Enter your full name.',
    email: isValidEmail(p.email) ? null : 'Enter a valid email address.',
    dob: dob.ok ? null : dob.reason,
    building: p.building.trim().length >= 3 ? null : 'Tell members what you are building.',
    category: p.category ? null : 'Pick the category that fits best.',
  };
  const valid = Object.values(errors).every((e) => e === null);
  const err = (k: keyof typeof errors) => (showErrors ? errors[k] : null);

  const onContinue = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    router.push('/auth/verify-docs');
  };

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow title="Set up your profile" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            style={styles.photoWrap}
            accessibilityRole="button"
            accessibilityLabel="Add your photo"
            onPress={async () => {
              const uri = await pickProfilePhoto();
              if (uri) actions.setProfile({ photoUri: uri });
            }}
          >
            <View>
              {p.photoUri ? (
                <Image source={{ uri: p.photoUri }} style={styles.photo} />
              ) : (
                <Hatched radius={s(48)} iconSize={s(26)} style={styles.photo} />
              )}
              <View style={styles.camera}>
                <Camera size={s(15)} color={colors.ink} strokeWidth={2.2} />
              </View>
            </View>
            <Text style={styles.photoText}>{p.photoUri ? 'Change photo' : 'Add your photo'}</Text>
          </Pressable>

          <TextField
            label="Full name"
            placeholder="e.g. Riya Kapoor"
            value={p.name}
            onChangeText={(v) => actions.setProfile({ name: v })}
            autoCapitalize="words"
            textContentType="name"
            error={err('name')}
          />
          <TextField
            containerStyle={styles.gap}
            label="Email address"
            placeholder="you@email.com"
            value={p.email}
            onChangeText={(v) => actions.setProfile({ email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            left={<Mail size={s(19)} color={colors.blue} strokeWidth={2} />}
            helper="We'll send billing updates here"
            error={err('email')}
          />
          <TextField
            containerStyle={styles.gap}
            label="Date of birth"
            placeholder="DD / MM / YYYY"
            value={p.dob}
            onChangeText={(v) => actions.setProfile({ dob: formatDob(v) })}
            keyboardType="number-pad"
            maxLength={14}
            left={<Calendar size={s(19)} color={colors.blue} strokeWidth={2} />}
            helper="You must be 18+ to join Vyaparhood — this isn't shown on your public profile"
            error={err('dob')}
          />
          <TextField
            containerStyle={styles.gap}
            label="What are you building?"
            placeholder="e.g. Third-wave coffee shop in Bandra"
            value={p.building}
            onChangeText={(v) => actions.setProfile({ building: v })}
            error={err('building')}
          />

          <Text style={[t.label, styles.gap, { marginBottom: s(10) }]}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={p.category === c.id}
                onPress={() => actions.setProfile({ category: c.id })}
              />
            ))}
          </View>
          {err('category') ? <Text style={[t.error, { marginTop: s(6) }]}>{err('category')}</Text> : null}

          <TextField
            containerStyle={styles.gap}
            label="Instagram / LinkedIn"
            optionalHint="(recommended)"
            placeholder="yourhandle"
            value={p.social}
            onChangeText={(v) => actions.setProfile({ social: v.replace(/^@/, '') })}
            autoCapitalize="none"
            autoCorrect={false}
            left={<AtSign size={s(18)} color={colors.text} strokeWidth={2} />}
            helper="Helps other members verify who you are"
          />
          <TextField
            containerStyle={styles.gap}
            label="One-line bio"
            optionalHint="(optional)"
            placeholder="What should people know about you?"
            value={p.bio}
            onChangeText={(v) => actions.setProfile({ bio: v })}
            maxLength={120}
          />
        </ScrollView>
        <Footer>
          <PrimaryButton label="Continue" onPress={onContinue} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

const PHOTO = s(96);
const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PAD, paddingTop: s(18), paddingBottom: s(24) },
  photoWrap: { alignItems: 'center', marginBottom: s(22) },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2 },
  camera: {
    position: 'absolute',
    right: -s(4),
    bottom: s(2),
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: colors.lime,
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: { fontFamily: fonts.displayBold, fontSize: s(16), color: colors.blue, marginTop: s(10) },
  gap: { marginTop: s(18) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(9) },
});
