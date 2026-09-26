import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../src/components/Buttons';
import { Chip, TextField } from '../src/components/Controls';
import { Hatched } from '../src/components/Hatched';
import { Camera, X } from '../src/components/icons';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../src/components/Layout';
import { CATEGORIES, CategoryId } from '../src/config';
import { FALLBACK_ME } from '../src/data/sample';
import { useApp } from '../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { pickProfilePhoto } from '../src/utils/media';

/** 28 · Edit profile. Changes apply only when saved. */
export default function EditProfile() {
  const router = useRouter();
  const { state, actions } = useApp();
  const p = state.profile;
  const [photoUri, setPhotoUri] = useState(p.photoUri);
  const [name, setName] = useState(p.name || FALLBACK_ME.name);
  const [building, setBuilding] = useState(p.building || FALLBACK_ME.building);
  const [category, setCategory] = useState<CategoryId>(p.category ?? FALLBACK_ME.category);
  const [bio, setBio] = useState(p.bio || FALLBACK_ME.bio);
  const [offers, setOffers] = useState(p.offers.length ? p.offers : FALLBACK_ME.offers);
  const [looking, setLooking] = useState(p.lookingFor.length ? p.lookingFor : FALLBACK_ME.lookingFor);

  const valid = name.trim().length >= 2 && building.trim().length >= 3;

  const save = () => {
    actions.setProfile({ photoUri, name: name.trim(), building: building.trim(), category, bio: bio.trim(), offers, lookingFor: looking });
    router.back();
  };

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow title="Edit profile" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            style={styles.photoWrap}
            onPress={async () => {
              const uri = await pickProfilePhoto();
              if (uri) setPhotoUri(uri);
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
            <Text style={styles.photoText}>Change photo</Text>
          </Pressable>

          <TextField label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <TextField containerStyle={styles.gap} label="What are you building?" value={building} onChangeText={setBuilding} />

          <Text style={[t.label, styles.gap, { marginBottom: s(10) }]}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>

          <TextField containerStyle={styles.gap} label="Bio" value={bio} onChangeText={setBio} multiline height={s(100)} maxLength={200} />

          <View style={[styles.columns, styles.gap]}>
            <TagColumn title="I offer" tone="teal" items={offers} onChange={setOffers} />
            <TagColumn title="Looking for" tone="blue" items={looking} onChange={setLooking} />
          </View>
        </ScrollView>
        <Footer>
          <PrimaryButton label="Save changes" icon="check" onPress={save} disabled={!valid} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

/** Tap a tag to remove it; "+ Add" to type a new one. */
function TagColumn({
  title,
  tone,
  items,
  onChange,
}: {
  title: string;
  tone: 'teal' | 'blue';
  items: string[];
  onChange: (v: string[]) => void;
}) {
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
          <Pressable
            key={it}
            onPress={() => onChange(items.filter((x) => x !== it))}
            accessibilityLabel={`Remove ${it}`}
            style={[styles.tag, { backgroundColor: bg }]}
          >
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
  tag: {
    height: s(36),
    borderRadius: s(18),
    borderWidth: BORDER,
    borderColor: colors.ink,
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: s(14.5) },
  addTag: { backgroundColor: colors.white, borderStyle: 'dashed' },
  tagInput: { backgroundColor: colors.white, minWidth: s(120), fontFamily: fonts.bodyMedium, fontSize: s(14.5), color: colors.ink, paddingVertical: 0 },
});
