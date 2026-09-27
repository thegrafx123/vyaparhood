import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../src/api';
import { friendlyError } from '../src/api/errors';
import { useSignedUrl } from '../src/api/hooks';
import { PrimaryButton } from '../src/components/Buttons';
import { Chip, TextField } from '../src/components/Controls';
import { Hatched } from '../src/components/Hatched';
import { Camera, Phone, X } from '../src/components/icons';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../src/components/Layout';
import { CATEGORIES, CategoryId } from '../src/config';
import { base64ToBytes } from '../src/lib/files';
import { PickedPhoto, pickPhoto } from '../src/lib/photoPicker';
import { useAuth } from '../src/state/AuthProvider';
import { BORDER, colors, fonts, H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { digitsOnly } from '../src/utils/validation';

/** 28 · Edit profile. */
export default function EditProfile() {
  const router = useRouter();
  const qc = useQueryClient();
  const { me, refreshMe } = useAuth();
  const p = me?.profile;
  const existingPhoto = useSignedUrl('avatars', p?.photo_path);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [name, setName] = useState(p?.full_name ?? '');
  const [headline, setHeadline] = useState(p?.headline ?? '');
  const [phone, setPhone] = useState(p?.phone ?? '');
  const [building, setBuilding] = useState(p?.building ?? '');
  const [category, setCategory] = useState<CategoryId | null>(p?.category ?? null);
  const [bio, setBio] = useState(p?.bio ?? '');
  const [offers, setOffers] = useState<string[]>(p?.offers ?? []);
  const [looking, setLooking] = useState<string[]>(p?.looking_for ?? []);
  const [saving, setSaving] = useState(false);

  const phoneOk = phone.length === 0 || /^[6-9]\d{9}$/.test(phone);
  const valid = name.trim().length >= 2 && building.trim().length >= 3 && phoneOk;

  const save = async () => {
    setSaving(true);
    try {
      let photoPath = p?.photo_path ?? null;
      if (photo) {
        photoPath = await api.me.uploadPhoto(base64ToBytes(photo.base64), photo.mime);
        if (p?.photo_path && p.photo_path !== photoPath) api.me.removeOldPhoto(p.photo_path).catch(() => {});
      }
      await api.me.update({
        full_name: name.trim(),
        headline: headline.trim(),
        phone: phone || null,
        building: building.trim(),
        category,
        bio: bio.trim(),
        offers,
        looking_for: looking,
        photo_path: photoPath,
      });
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['signed'] });
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const photoUri = photo?.uri ?? existingPhoto ?? null;

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow title="Edit profile" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            style={styles.photoWrap}
            onPress={async () => {
              const picked = await pickPhoto();
              if (picked) setPhoto(picked);
            }}
          >
            <View>
              {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <Hatched radius={s(48)} iconSize={s(26)} style={styles.photo} />}
              <View style={styles.camera}>
                <Camera size={s(15)} color={colors.ink} strokeWidth={2.2} />
              </View>
            </View>
            <Text style={styles.photoText}>Change photo</Text>
          </Pressable>

          <TextField label="Full name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={80} />
          <TextField
            containerStyle={styles.gap}
            label="Title"
            optionalHint="(shown on your card)"
            placeholder="e.g. Founder, Cafe Loom"
            value={headline}
            onChangeText={setHeadline}
            maxLength={80}
          />
          <TextField
            containerStyle={styles.gap}
            label="Mobile number"
            optionalHint="(optional)"
            placeholder="98765 43210"
            value={phone}
            onChangeText={(v) => setPhone(digitsOnly(v).slice(0, 10))}
            keyboardType="phone-pad"
            left={<Phone size={s(18)} color={colors.blue} strokeWidth={2} />}
            helper="Not shown to other members"
            error={phoneOk ? null : 'Enter a 10-digit mobile number.'}
          />
          <TextField containerStyle={styles.gap} label="What are you building?" value={building} onChangeText={setBuilding} maxLength={120} />

          <Text style={[t.label, styles.gap, { marginBottom: s(10) }]}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>

          <TextField containerStyle={styles.gap} label="Bio" value={bio} onChangeText={setBio} multiline height={s(100)} maxLength={300} />

          <View style={[styles.columns, styles.gap]}>
            <TagColumn title="I offer" tone="teal" items={offers} onChange={setOffers} />
            <TagColumn title="Looking for" tone="blue" items={looking} onChange={setLooking} />
          </View>
        </ScrollView>
        <Footer>
          <PrimaryButton label="Save changes" icon="check" onPress={save} disabled={!valid} loading={saving} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

/** Tap a tag to remove it; "+ Add" to type a new one (max 5). */
function TagColumn({ title, tone, items, onChange }: { title: string; tone: 'teal' | 'blue'; items: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const bg = tone === 'teal' ? colors.tealSoft : colors.blueSoft;
  const fg = tone === 'teal' ? colors.teal : colors.blue;

  const commit = () => {
    const v = draft.trim();
    if (v && !items.includes(v) && items.length < 5) onChange([...items, v]);
    setDraft('');
    setAdding(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={[t.label, { marginBottom: s(10) }]}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
        {items.map((it) => (
          <Pressable key={it} onPress={() => onChange(items.filter((x) => x !== it))} accessibilityLabel={`Remove ${it}`} style={[styles.tag, { backgroundColor: bg }]}>
            <Text style={[styles.tagText, { color: fg }]}>{it}</Text>
            <X size={s(12)} color={fg} strokeWidth={2.6} />
          </Pressable>
        ))}
        {adding ? (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            onBlur={commit}
            placeholder="Type & press enter"
            placeholderTextColor={colors.placeholder}
            style={[styles.tag, styles.tagInput]}
            returnKeyType="done"
            maxLength={30}
          />
        ) : (
          items.length < 5 && (
            <Pressable onPress={() => setAdding(true)} style={[styles.tag, styles.addTag]}>
              <Text style={[styles.tagText, { color: colors.ink }]}>+ Add</Text>
            </Pressable>
          )
        )}
      </View>
    </View>
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
  columns: { flexDirection: 'row', gap: s(16) },
  tag: { height: s(36), borderRadius: s(18), borderWidth: BORDER, borderColor: colors.ink, paddingHorizontal: s(14), flexDirection: 'row', alignItems: 'center', gap: s(6) },
  tagText: { fontFamily: fonts.bodyBold, fontSize: s(14.5) },
  addTag: { backgroundColor: colors.white, borderStyle: 'dashed' },
  tagInput: { backgroundColor: colors.white, minWidth: s(120), fontFamily: fonts.bodyMedium, fontSize: s(14.5), color: colors.ink, paddingVertical: 0 },
});
