import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../src/components/Buttons';
import { TextField } from '../src/components/Controls';
import { Heading } from '../src/components/Heading';
import { MapPin } from '../src/components/icons';
import { BrandHeader, Footer, KeyboardArea, Screen } from '../src/components/Layout';
import { resolveLocation } from '../src/services/location';
import { useApp } from '../src/state/AppStore';
import { colors, fonts, H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { digitsOnly, isValidPincode } from '../src/utils/validation';

/**
 * Shown when location permission is denied or unavailable.
 * Pincode, area and city are required — the user can't continue without them.
 * Later the backend maps the pincode to a location point (free India Post
 * pincode dataset) and then to an H3 cell, so no geocoding API is needed.
 */
export default function ManualAddress() {
  const router = useRouter();
  const { state, actions } = useApp();
  const [pincode, setPincode] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [line, setLine] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState(false);

  const errors = useMemo(
    () => ({
      pincode: isValidPincode(pincode) ? null : 'Enter a valid 6-digit pincode.',
      locality: locality.trim().length >= 2 ? null : 'Enter your area or locality.',
      city: city.trim().length >= 2 ? null : 'Enter your city.',
    }),
    [pincode, locality, city],
  );
  const valid = !errors.pincode && !errors.locality && !errors.city;

  const onContinue = () => {
    if (!valid) {
      setTouched({ pincode: true, locality: true, city: true });
      return;
    }
    actions.setLocation({
      source: 'manual',
      manualAddress: {
        pincode: pincode.trim(),
        locality: locality.trim(),
        city: city.trim(),
        line: line.trim(),
      },
    });
    router.replace('/welcome');
  };

  const useMyLocation = async () => {
    if (!state.location.canAskAgain) {
      Linking.openSettings();
      return;
    }
    setRetrying(true);
    const result = await resolveLocation();
    setRetrying(false);
    if (result.status === 'granted') {
      actions.setLocation({
        status: 'granted',
        source: 'device',
        coords: result.coords,
        geohash: result.geohash,
        detectedCity: result.city,
      });
      router.replace('/welcome');
    } else if (result.status === 'denied') {
      actions.setLocation({ status: 'denied', canAskAgain: result.canAskAgain });
    }
  };

  return (
    <Screen>
      <KeyboardArea>
        <BrandHeader />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Heading parts={['Add your', { accent: 'area', squiggle: 'lime' }]} />
          <Text style={[t.subtitle, { marginTop: s(10) }]}>
            Location is off, so tell us roughly where you work. We use this to show members near you —
            your address is never shown to anyone.
          </Text>

          <TextField
            containerStyle={{ marginTop: s(26) }}
            label="Pincode"
            placeholder="e.g. 400050"
            keyboardType="number-pad"
            maxLength={6}
            value={pincode}
            onChangeText={(v) => setPincode(digitsOnly(v))}
            onBlur={() => setTouched((x) => ({ ...x, pincode: true }))}
            error={touched.pincode ? errors.pincode : null}
            left={<MapPin size={s(18)} color={colors.blue} strokeWidth={2.2} />}
          />
          <TextField
            containerStyle={{ marginTop: s(18) }}
            label="Area / locality"
            placeholder="e.g. Bandra West"
            value={locality}
            onChangeText={setLocality}
            onBlur={() => setTouched((x) => ({ ...x, locality: true }))}
            error={touched.locality ? errors.locality : null}
            autoCapitalize="words"
          />
          <TextField
            containerStyle={{ marginTop: s(18) }}
            label="City"
            placeholder="e.g. Mumbai"
            value={city}
            onChangeText={setCity}
            onBlur={() => setTouched((x) => ({ ...x, city: true }))}
            error={touched.city ? errors.city : null}
            autoCapitalize="words"
          />
          <TextField
            containerStyle={{ marginTop: s(18) }}
            label="Shop or street"
            optionalHint="(optional)"
            placeholder="e.g. Shop 4, Hill Road"
            value={line}
            onChangeText={setLine}
            helper="Only used for verification. Never shown to other members."
          />

          <Pressable onPress={useMyLocation} disabled={retrying} style={styles.retry} hitSlop={8}>
            <Text style={styles.retryText}>
              {retrying
                ? 'Checking location…'
                : state.location.canAskAgain
                  ? 'Use my current location instead'
                  : 'Turn on location in Settings'}
            </Text>
          </Pressable>
        </ScrollView>
        <Footer>
          <PrimaryButton label="Continue" onPress={onContinue} disabled={!valid} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PAD, paddingTop: s(30), paddingBottom: s(24) },
  retry: { alignSelf: 'flex-start', marginTop: s(22) },
  retryText: { fontFamily: fonts.displayBold, fontSize: s(16), color: colors.blue },
});
