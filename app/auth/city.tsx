import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { useAuth } from '../../src/state/AuthProvider';
import { PrimaryButton } from '../../src/components/Buttons';
import { Chip } from '../../src/components/Controls';
import { Heading } from '../../src/components/Heading';
import { Search } from '../../src/components/icons';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../../src/components/Layout';
import { ALL_CITIES, POPULAR_CITIES } from '../../src/config';
import { useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

/** 10 · City picker. `?mode=change` is used from Discover / Settings. */
export default function City() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { state, actions } = useApp();
  const { me, refreshMe } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const guess =
    me?.profile.city ?? state.city ?? state.location.manualAddress?.city ?? state.location.detectedCity ?? null;
  const initial = guess ? ALL_CITIES.find((c) => c.toLowerCase() === guess.toLowerCase()) ?? null : null;
  const [selected, setSelected] = useState<string | null>(initial);
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return selected && !POPULAR_CITIES.includes(selected) ? [selected, ...POPULAR_CITIES] : POPULAR_CITIES;
    }
    return ALL_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [query, selected]);

  const onContinue = async () => {
    if (!selected) return;
    actions.setCity(selected);
    if (mode !== 'change') {
      router.push('/auth/profile-setup');
      return;
    }
    setSaving(true);
    try {
      await api.me.update({ city: selected });
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['discover'] });
      router.back();
    } catch (e) {
      Alert.alert("Couldn't change city", friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Heading parts={['Where are you', { accent: 'building', squiggle: 'lime', suffix: '?' }]} />
          <View style={styles.search}>
            <Search size={s(20)} color={colors.text} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your city"
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>
          <Text style={[t.sectionLabel, { marginTop: s(30), marginBottom: s(14) }]}>
            {query ? 'RESULTS' : 'POPULAR CITIES'}
          </Text>
          <View style={styles.chips}>
            {list.map((c) => (
              <Chip key={c} label={c} size="lg" selected={c === selected} onPress={() => setSelected(c)} />
            ))}
            {list.length === 0 && (
              <Text style={t.body}>We're not in that city yet. Pick the closest one for now.</Text>
            )}
          </View>
        </ScrollView>
        <Footer>
          <PrimaryButton label="Continue" onPress={onContinue} disabled={!selected} loading={saving} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PAD, paddingTop: s(26), paddingBottom: s(20) },
  search: {
    marginTop: s(22),
    height: s(50),
    borderRadius: s(25),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(18),
  },
  searchInput: { flex: 1, marginLeft: s(12), fontFamily: fonts.body, fontSize: s(17), color: colors.ink, paddingVertical: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(11) },
});
