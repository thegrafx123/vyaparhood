import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as api from '../api';
import { friendlyError } from '../api/errors';
import { keys } from '../api/hooks';
import { Me } from '../api/types';
import { CATEGORIES, CategoryId } from '../config';
import { pickPhoto, PickedPhoto } from '../lib/photoPicker';
import { reportError } from '../lib/sentry';
import { FadeUp } from '../motion';
import { geocodeAddress } from '../services/location';
import { colors, fonts, H_PAD, s } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { checkDob, digitsOnly, dobBounds, formatDob, isValidEmail, isValidPincode } from '../utils/validation';
import { MemberPhoto } from '../ui/Avatar';
import { CtaButton } from '../ui/Buttons';
import { DateField } from '../ui/DateField';
import { Chip, Field, Helper, Label, TagInput } from '../ui/Form';
import { Calendar, Camera, Mail, Pin } from '../ui/icons';
import { Footer } from '../ui/Screen';

type Errors = Partial<Record<'name' | 'email' | 'dob' | 'headline' | 'category' | 'address' | 'locality' | 'pincode' | 'city' | 'form', string>>;

/**
 * Slide 10 (create) and 26 (edit). Includes the business address — the
 * permanent location other members find this business by. We only ever
 * keep one photo per member, collected here.
 */
export function ProfileForm({
  me,
  mode,
  onSaved,
}: {
  me: Me;
  mode: 'create' | 'edit';
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const p = me.profile;
  const b = me.business;
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [name, setName] = useState(p.full_name);
  const [email, setEmail] = useState(p.email ?? '');
  const [dob, setDob] = useState(p.dob ? formatDob(p.dob.split('-').reverse().join('')) : '');
  const [headline, setHeadline] = useState(p.headline);
  const [category, setCategory] = useState<CategoryId | null>(p.category);
  const [handle, setHandle] = useState(p.social_handle ?? '');
  const [bio, setBio] = useState(p.bio);
  const [offers, setOffers] = useState<string[]>(p.offers);
  const [lookingFor, setLookingFor] = useState<string[]>(p.looking_for);
  const [address, setAddress] = useState(b?.address_line ?? '');
  const [locality, setLocality] = useState(b?.locality ?? p.area ?? '');
  const [pincode, setPincode] = useState(b?.pincode ?? '');
  const [city, setCity] = useState(b?.city ?? p.city ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [dobRange] = useState(() => dobBounds());

  const choosePhoto = async () => {
    try {
      const picked = await pickPhoto();
      if (picked) setPhoto(picked);
    } catch (e) {
      reportError(e, { where: 'pickPhoto' });
      Alert.alert('Could not open photos', 'Check that Vyaparhood can access your photos in Settings.');
    }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Enter your full name.';
    if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
    if (mode === 'create') {
      const d = checkDob(dob);
      if (!d.ok) e.dob = d.reason;
    }
    if (headline.trim().length < 3) e.headline = 'Tell people what you are building.';
    if (!category) e.category = 'Pick a category.';
    if (address.trim().length < 5) e.address = 'Enter your shop / office address.';
    if (locality.trim().length < 2) e.locality = 'Enter the area, e.g. Bandra West.';
    if (!isValidPincode(pincode)) e.pincode = 'Enter the 6-digit pincode.';
    if (city.trim().length < 2) e.city = 'Enter your city.';
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      let photoPath = p.photo_path;
      if (photo) {
        photoPath = await api.me.uploadPhoto(photo.bytes);
        qc.removeQueries({ queryKey: keys.signed(photoPath) });
      }

      const coords = await geocodeAddress({ line: address.trim(), locality: locality.trim(), city: city.trim(), pincode });
      const placedBy = await api.location.setBusiness({
        addressLine: address.trim(),
        locality: locality.trim(),
        pincode,
        city: city.trim(),
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });

      const dobIso = mode === 'create' ? (() => {
        const d = digitsOnly(dob);
        return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
      })() : undefined;

      await api.me.update({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(dobIso ? { dob: dobIso } : null),
        headline: headline.trim(),
        category,
        social_handle: handle.trim().replace(/^@/, '') || null,
        bio: bio.trim(),
        offers,
        looking_for: lookingFor,
        city: city.trim(),
        area: locality.trim(),
        photo_path: photoPath,
        ...(mode === 'create' ? { onboarding_completed: true } : null),
      });

      const done = () => {
        setBusy(false);
        onSaved();
      };
      if (placedBy === 'none') {
        Alert.alert(
          "We couldn't place your address on the map",
          'You will still show up in Citywide search. To appear in Nearby search too, add more detail to your address (building, street) in Edit profile.',
          [{ text: 'OK', onPress: done }],
        );
      } else {
        done();
      }
    } catch (err) {
      setErrors({ form: friendlyError(err) });
      setBusy(false);
    }
  };

  let d = 80;
  const next = () => (d += 40);

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: s(20), paddingBottom: s(24), gap: s(16) }}
      >
        <FadeUp delay={d} style={{ alignItems: 'center', gap: s(10) }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={p.photo_path || photo ? 'Change photo' : 'Add your photo'}
            onPress={choosePhoto}
            style={{ alignItems: 'center', gap: s(10) }}
          >
            <View>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={{ width: s(96), height: s(96), borderRadius: s(48), borderWidth: s(2.5), borderColor: colors.ink }} />
              ) : (
                <MemberPhoto path={p.photo_path} size={s(96)} radius={s(48)} borderColor={p.photo_path ? colors.ink : undefined} />
              )}
              <View
                style={{
                  position: 'absolute',
                  bottom: -s(2),
                  right: -s(2),
                  width: s(30),
                  height: s(30),
                  borderRadius: s(15),
                  backgroundColor: colors.lime,
                  borderWidth: s(2.5),
                  borderColor: colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={s(14)} color={colors.ink} />
              </View>
            </View>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(12.5), color: colors.blue }}>
              {p.photo_path || photo ? 'Change photo' : 'Add your photo'}
            </Text>
          </Pressable>
        </FadeUp>

        <FadeUp delay={next()}>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Riya Kapoor" autoComplete="name" textContentType="name" maxLength={80} error={errors.name} />
        </FadeUp>

        <FadeUp delay={next()}>
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            left={<Mail size={s(15)} color={colors.blue} />}
            helper="We'll send booking & billing updates here"
            error={errors.email}
          />
        </FadeUp>

        {mode === 'create' && (
          <FadeUp delay={next()}>
            <DateField
              label="Date of birth"
              value={dob}
              onChange={setDob}
              placeholder="DD / MM / YYYY"
              minimumDate={dobRange.min}
              maximumDate={dobRange.max}
              left={<Calendar size={s(15)} color={colors.blue} />}
              helper="You must be 18+ to join Vyaparhood — this isn't shown on your public profile"
              error={errors.dob}
            />
          </FadeUp>
        )}

        <FadeUp delay={next()}>
          <Field
            label="What are you building?"
            value={headline}
            onChangeText={setHeadline}
            placeholder="e.g. Third-wave coffee shop in Bandra"
            maxLength={80}
            error={errors.headline}
          />
        </FadeUp>

        <FadeUp delay={next()}>
          <Label>Category</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
          {errors.category ? <Helper error>{errors.category}</Helper> : null}
        </FadeUp>

        <FadeUp delay={next()}>
          <View
            style={{
              backgroundColor: colors.white,
              borderWidth: s(2.5),
              borderColor: colors.ink,
              borderRadius: s(20),
              padding: s(16),
              gap: s(14),
              boxShadow: `${s(4)}px ${s(5)}px 0px rgba(22,35,63,0.12)`,
            }}
          >
            <View style={{ flexDirection: 'row', gap: s(10), alignItems: 'flex-start' }}>
              <View
                style={{
                  width: s(32),
                  height: s(32),
                  borderRadius: s(10),
                  backgroundColor: colors.blueSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pin size={s(16)} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: s(14.5), color: colors.ink }}>Business address</Text>
                <Text style={[t.helper, { fontSize: s(11), lineHeight: s(15), marginTop: s(2) }]}>
                  Members nearby find you by this address. They only see your area and how far away you are — never the address.
                </Text>
              </View>
            </View>
            <Field
              label="Shop / office address"
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Shop 4, Sea View Bldg, Hill Road"
              maxLength={200}
              autoComplete="street-address"
              error={errors.address}
            />
            <Field label="Area / locality" value={locality} onChangeText={setLocality} placeholder="e.g. Bandra West" maxLength={80} error={errors.locality} />
            <View style={{ flexDirection: 'row', gap: s(12) }}>
              <Field
                label="Pincode"
                value={pincode}
                onChangeText={(v) => setPincode(digitsOnly(v).slice(0, 6))}
                placeholder="400050"
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="postal-code"
                error={errors.pincode}
                containerStyle={{ flex: 1 }}
              />
              <Field label="City" value={city} onChangeText={setCity} placeholder="Mumbai" maxLength={60} error={errors.city} containerStyle={{ flex: 1.2 }} />
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={next()}>
          <Field
            label="Instagram / LinkedIn"
            optional="(recommended)"
            value={handle}
            onChangeText={setHandle}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={60}
            left={<Text style={{ fontFamily: fonts.bodyBold, fontSize: s(14), color: colors.blue }}>@</Text>}
            helper="Shared with members once you connect — helps them know who you are"
          />
        </FadeUp>

        <FadeUp delay={next()}>
          <Field
            label={mode === 'create' ? 'One-line bio' : 'Bio'}
            optional="(optional)"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people what you're about..."
            multiline
            maxLength={300}
          />
        </FadeUp>

        <FadeUp delay={next()} style={{ flexDirection: 'row', gap: s(12) }}>
          <View style={{ flex: 1 }}>
            <Label>I offer</Label>
            <TagInput values={offers} onChange={setOffers} tone="teal" />
          </View>
          <View style={{ flex: 1 }}>
            <Label>I'm looking for</Label>
            <TagInput values={lookingFor} onChange={setLookingFor} tone="blue" />
          </View>
        </FadeUp>

        {errors.form ? <Helper error>{errors.form}</Helper> : null}
        {Object.keys(errors).length > 0 && !errors.form ? <Helper error>Please fix the highlighted fields.</Helper> : null}
      </ScrollView>

      <FadeUp delay={440}>
        <Footer style={{ paddingTop: s(10) }}>
          <CtaButton label={mode === 'create' ? 'Continue' : 'Save changes'} onPress={save} loading={busy} />
        </Footer>
      </FadeUp>
    </>
  );
}
