import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useDiscover, useDiscoveryContext } from '../src/api/hooks';
import { SortBy } from '../src/api/types';
import { CATEGORIES, CategoryId, DISTANCE_MAX_KM, DISTANCE_MIN_KM } from '../src/config';
import { DistanceSlider } from '../src/features/DistanceSlider';
import { FadeUp } from '../src/motion';
import { DEFAULT_FILTERS, Filters, useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { CtaButton, TextButton } from '../src/ui/Buttons';
import { Chip, Toggle } from '../src/ui/Form';
import { BottomSheet } from '../src/ui/Sheet';

const SORTS: { id: SortBy; label: string }[] = [
  { id: 'nearest', label: 'Nearest first' },
  { id: 'newest', label: 'Newest members' },
  { id: 'rating', label: 'Top rated' },
];

/** 16 · Search filters. The result count is a live query. */
export default function FiltersSheet() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { me } = useAuth();
  const { data: context } = useDiscoveryContext();
  const [draft, setDraft] = useState<Filters>(state.filters);
  const mode = state.discoverMode;
  const city = state.discoverCity ?? context?.live_city ?? me?.profile.city ?? null;

  const { data: preview, isFetching } = useDiscover({
    mode,
    city: mode === 'citywide' ? city : null,
    maxKm: draft.distanceKm,
    categories: draft.categories,
    verifiedOnly: draft.verifiedOnly,
    sort: draft.sortBy,
  });
  const count = preview?.length ?? 0;

  const toggleCategory = (id: CategoryId) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(id) ? d.categories.filter((c) => c !== id) : [...d.categories, id],
    }));

  const apply = () => {
    actions.applyFilters(draft);
    router.back();
  };

  return (
    <BottomSheet onDismiss={() => router.back()} scroll>
      <FadeUp delay={100} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: s(20), color: colors.ink }} accessibilityRole="header">
          Filters
        </Text>
        <TextButton label="Reset" onPress={() => setDraft(DEFAULT_FILTERS)} />
      </FadeUp>

      <FadeUp delay={160} style={{ marginTop: s(20) }}>
        <Text style={[t.label, { marginBottom: s(10) }]}>Distance {mode === 'citywide' ? <Text style={t.helper}>(Nearby)</Text> : null}</Text>
        <DistanceSlider
          value={draft.distanceKm}
          min={DISTANCE_MIN_KM}
          max={DISTANCE_MAX_KM}
          step={0.5}
          onChange={(v) => setDraft((d) => ({ ...d, distanceKm: v }))}
        />
      </FadeUp>

      <FadeUp delay={220} style={{ marginTop: s(22) }}>
        <Text style={[t.label, { marginBottom: s(10) }]}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} size="md" selected={draft.categories.includes(c.id)} onPress={() => toggleCategory(c.id)} />
          ))}
        </View>
      </FadeUp>

      <FadeUp delay={280} style={{ marginTop: s(22) }}>
        <Text style={[t.label, { marginBottom: s(10) }]}>Sort by</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
          {SORTS.map((o) => (
            <Chip key={o.id} label={o.label} size="md" selected={draft.sortBy === o.id} onPress={() => setDraft((d) => ({ ...d, sortBy: o.id }))} />
          ))}
        </View>
      </FadeUp>

      <FadeUp delay={340} style={{ marginTop: s(22), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={t.row}>Verified profiles only</Text>
        <Toggle label="Verified profiles only" value={draft.verifiedOnly} onChange={(v) => setDraft((d) => ({ ...d, verifiedOnly: v }))} />
      </FadeUp>

      <FadeUp delay={400} style={{ marginTop: s(22) }}>
        <CtaButton
          label={isFetching && !preview ? 'Counting…' : `Show ${count} result${count === 1 ? '' : 's'}`}
          size="md"
          onPress={apply}
        />
      </FadeUp>
    </BottomSheet>
  );
}
