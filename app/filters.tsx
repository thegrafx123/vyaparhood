import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../src/components/Buttons';
import { Chip, Toggle } from '../src/components/Controls';
import { DistanceSlider } from '../src/components/DistanceSlider';
import { BottomSheet } from '../src/components/Layout';
import { CATEGORIES, CategoryId, DISTANCE_MAX_KM, DISTANCE_MIN_KM } from '../src/config';
import { HIDDEN_FROM_DISCOVER } from '../src/data/sample';
import { Filters, SortBy, useApp } from '../src/state/AppStore';
import { colors, fonts, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

const SORTS: { id: SortBy; label: string }[] = [
  { id: 'nearest', label: 'Nearest first' },
  { id: 'newest', label: 'Newest members' },
  { id: 'rating', label: 'Top rated' },
];

const DEFAULTS: Filters = { distanceKm: 4.5, categories: [], sortBy: 'nearest', verifiedOnly: true };

/** 18 · Filters (bottom sheet over Discover). */
export default function FiltersSheet() {
  const router = useRouter();
  const { state, actions } = useApp();
  const [draft, setDraft] = useState<Filters>(state.filters);

  const toggleCategory = (id: CategoryId) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(id) ? d.categories.filter((c) => c !== id) : [...d.categories, id],
    }));

  const count = useMemo(
    () =>
      state.members.filter(
        (m) =>
          !state.blockedIds.includes(m.id) &&
          !HIDDEN_FROM_DISCOVER.includes(m.id) &&
          m.distanceKm <= draft.distanceKm &&
          (draft.categories.length === 0 || draft.categories.includes(m.category)) &&
          (!draft.verifiedOnly || m.verified),
      ).length,
    [draft, state.members, state.blockedIds],
  );

  return (
    <BottomSheet onDismiss={() => router.back()}>
      <View style={styles.head}>
        <Text style={styles.title}>Filters</Text>
        <Pressable onPress={() => setDraft(DEFAULTS)} hitSlop={10}>
          <Text style={t.link}>Reset</Text>
        </Pressable>
      </View>

      <Text style={[t.label, styles.section]}>Distance</Text>
      <DistanceSlider
        value={draft.distanceKm}
        min={DISTANCE_MIN_KM}
        max={DISTANCE_MAX_KM}
        step={0.5}
        onChange={(v) => setDraft((d) => ({ ...d, distanceKm: v }))}
      />

      <Text style={[t.label, styles.section]}>Category</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} selected={draft.categories.includes(c.id)} onPress={() => toggleCategory(c.id)} />
        ))}
      </View>

      <Text style={[t.label, styles.section]}>Sort by</Text>
      <View style={styles.chips}>
        {SORTS.map((o) => (
          <Chip key={o.id} label={o.label} selected={draft.sortBy === o.id} onPress={() => setDraft((d) => ({ ...d, sortBy: o.id }))} />
        ))}
      </View>

      <View style={styles.verified}>
        <Text style={[t.label, { fontSize: s(16.5) }]}>Verified profiles only</Text>
        <Toggle
          label="Verified profiles only"
          value={draft.verifiedOnly}
          onChange={(v) => setDraft((d) => ({ ...d, verifiedOnly: v }))}
        />
      </View>

      <PrimaryButton
        style={{ marginTop: s(22) }}
        label={`Show ${count} result${count === 1 ? '' : 's'}`}
        onPress={() => {
          actions.applyFilters(draft);
          router.back();
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: s(25), color: colors.ink },
  section: { marginTop: s(22), marginBottom: s(12) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(9) },
  verified: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s(26) },
});
