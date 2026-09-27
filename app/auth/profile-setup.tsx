import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { useSignedUrl } from '../../src/api/hooks';
import { PrimaryButton } from '../../src/components/Buttons';
import { Chip, TextField } from '../../src/components/Controls';
import { Hatched } from '../../src/components/Hatched';
import { AtSign, Calendar, Camera, Mail, Phone } from '../../src/components/icons';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../../src/components/Layout';
import { CATEGORIES, CategoryId } from '../../src/config';
import { base64ToBytes } from '../../src/lib/files';
import { PickedPhoto, pickPhoto } from '../../src/lib/photoPicker';
import { reportError } from '../../src/lib/sentry';
import { syncLocation } from '../../src/lib/syncLocation';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { checkDob, digitsOnly, formatDob } from '../../src/utils/validation';

/** "DD / MM / YYYY" <-> "YYYY-MM-DD" (database date). */
const dobToIso = (v: string) => {
  const d = digitsOnly(v);
  return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
};
const isoToDob = (iso: string | null) => (iso ? formatDob(iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4)) : '');

/** 11 · Profile setup — saved to Supabase. */
export default function ProfileSetup() {
  const router = useRouter();
  const { state } = useApp();
  const { me, email, refreshMe } = useAuth();
  const p = me?.profile;

  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [name, setName] = useState(p?.full_name ?? '');
  const [phone, setPhone] = useState(p?.phone ?? '');
  const [dob, setDob] = useState(isoToDob(p?.dob ?? null));
  const [building, setBuilding] = useState(p?.building ?? '');
  const [category, setCategory] = useState<CategoryId | null>(p?.category ?? null);
  const [social, setSocial] = useState(p?.social_handle ?? '');
  const [bio, setBio] = useState(p?.bio ?? '');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const existingPhoto = useSignedUrl('avatars', p?.photo_path);

  const dobCheck = checkDob(dob);
  const phoneDigits = digitsOnly(phone);
  const errors = {
    name: name.trim().length >= 2 ? null : 'Enter your full name.',
    phone: phoneDigits.length === 0 || /^[6-9]\d{9}$/.test(phoneDigits) ? null : 'Enter a 10-digit mobile number.',
    dob: dobCheck.ok ? null : dobCheck.reason,
    building: building.trim().length >= 3 ? null : 'Tell members what you are building.',
    category: category ? null : 'Pick the category that fits best.',
  };
  const valid = Object.values(errors).every((e) => e === null);
  const err = (k: keyof typeof errors) => (showErrors ? errors[k] : null);

  const onContinue = async () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      let photoPath = p?.photo_path ?? null;
      if (photo) {
        photoPath = await api.me.uploadPhoto(base64ToBytes(photo.base64), photo.mime);
        if (p?.photo_path && p.photo_path !== photoPath) api.me.removeOldPhoto(p.photo_path).catch(() => {});
      }
      await api.me.update({
        full_name: name.trim(),
        phone: phoneDigits || null,
        dob: dobToIso(dob),
        building: building.trim(),
        category,
        social_handle: social.trim() || null,
        bio: bio.trim(),
        city: state.city ?? p?.city ?? state.location.detectedCity ?? state.location.manualAddress?.city ?? null,
        photo_path: photoPath,
        onboarding_completed: true,
      });
      await syncLocation(state.location);
      await refreshMe();
      router.push('/auth/verify-docs');
    } catch (e) {
      reportError(e, { where: 'profile-setup' });
      Alert.alert("Couldn't save your profile", friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const photoUri = photo?.uri ?? existingPhoto ?? null;

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
              const picked = await pickPhoto();
              if (picked) setPhoto(picked);
            }}
          >
            <View>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <Hatched radius={s(48)} iconSize={s(26)} style={styles.photo} />
              )}
              <View style={styles.camera}>
                <Camera size={s(15)} color={colors.ink} strokeWidth={2.2} />
              </View>
            </View>
            <Text style={styles.photoText}>{photoUri ? 'Change photo' : 'Add your photo'}</Text>
          </Pressable>

          <TextField
            label="Full name"
            placeholder="e.g. Riya Kapoor"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            textContentType="name"
            error={err('name')}
          />
          <TextField
            containerStyle={styles.gap}
            label="Email address"
            value={email ?? ''}
            editable={false}
            left={<Mail size={s(19)} color={colors.blue} strokeWidth={2} />}
            helper="Verified · we'll send billing updates here"
          />
          <TextField
            containerStyle={styles.gap}
            label="Mobile number"
            optionalHint="(optional)"
            placeholder="98765 43210"
            value={phone}
            onChangeText={(v) => setPhone(digitsOnly(v).slice(0, 10))}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            left={<Phone size={s(18)} color={colors.blue} strokeWidth={2} />}
            helper="Not shown to other members"
            error={err('phone')}
          />
          <TextField
            containerStyle={styles.gap}
            label="Date of birth"
            placeholder="DD / MM / YYYY"
            value={dob}
            onChangeText={(v) => setDob(formatDob(v))}
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
            value={building}
            onChangeText={setBuilding}
            maxLength={120}
            error={err('building')}
          />

          <Text style={[t.label, styles.gap, { marginBottom: s(10) }]}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
          {err('category') ? <Text style={[t.error, { marginTop: s(6) }]}>{err('category')}</Text> : null}

          <TextField
            containerStyle={styles.gap}
            label="Instagram / LinkedIn"
            optionalHint="(recommended)"
            placeholder="yourhandle"
            value={social}
            onChangeText={(v) => setSocial(v.replace(/^@/, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={60}
            left={<AtSign size={s(18)} color={colors.text} strokeWidth={2} />}
            helper="Helps other members verify who you are"
          />
          <TextField
            containerStyle={styles.gap}
            label="One-line bio"
            optionalHint="(optional)"
            placeholder="What should people know about you?"
            value={bio}
            onChangeText={setBio}
            maxLength={120}
          />
        </ScrollView>
        <Footer>
          <PrimaryButton label="Continue" onPress={onContinue} loading={saving} />
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
