import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ALL_CITIES, POPULAR_CITIES } from '../config';
import { FadeUp } from '../motion';
import { colors, s } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { Chip, Field } from './Form';
import { Search } from './icons';

const titleCase = (v: string) =>
  v
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

/** "Search your city" + city chips (slide 9, and the Discover city switcher). */
export function CityPicker({
  value,
  onChange,
  suggested,
  baseDelay = 180,
}: {
  value: string | null;
  onChange: (city: string) => void;
  /** e.g. the city we detected from the phone's location. */
  suggested?: string | null;
  baseDelay?: number;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const chips = useMemo(() => {
    if (q) {
      const hits = ALL_CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 12);
      const typed = titleCase(query);
      return hits.some((h) => h.toLowerCase() === q) || typed.length < 3 ? hits : [...hits, typed];
    }
    const list = [...POPULAR_CITIES];
    for (const extra of [value, suggested]) {
      if (extra && !list.includes(extra)) list.unshift(extra);
    }
    return list;
  }, [q, query, value, suggested]);

  return (
    <View>
      <FadeUp delay={baseDelay}>
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder="Search your city"
          autoCorrect={false}
          returnKeyType="search"
          left={<Search size={s(18)} color={colors.text} />}
          accessibilityLabel="Search your city"
        />
      </FadeUp>
      <FadeUp delay={baseDelay + 60} style={{ marginTop: s(24), marginBottom: s(12) }}>
        <Text style={[t.sectionLabel, { fontSize: s(12), letterSpacing: s(0.6) }]}>{q ? 'Matching cities' : 'Popular cities'}</Text>
      </FadeUp>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(10) }}>
        {chips.map((c, i) => (
          <FadeUp key={c} delay={q ? 0 : baseDelay + 100 + i * 30}>
            <Chip label={c} size="lg" selected={value === c} onPress={() => onChange(c)} />
          </FadeUp>
        ))}
        {q && chips.length === 0 ? <Text style={t.meta}>Keep typing your city's name…</Text> : null}
      </View>
    </View>
  );
}
