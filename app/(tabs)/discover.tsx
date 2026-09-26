import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CompactCta, OutlineButton } from '../../src/components/Buttons';
import { Chip, Segmented } from '../../src/components/Controls';
import { Avatar, VerifiedBadge } from '../../src/components/Hatched';
import { Bell, ChevronDown, MapPin, SlidersHorizontal } from '../../src/components/icons';
import { Screen, SoftCard } from '../../src/components/Layout';
import { MemberCard } from '../../src/components/MemberCard';
import { Radar } from '../../src/components/Radar';
import { CATEGORIES, CategoryId } from '../../src/config';
import { HIDDEN_FROM_DISCOVER, Member } from '../../src/data/sample';
import { formatDistance } from '../../src/services/location';
import { AppState, myCity, relationWith, useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

type Mode = 'nearby' | 'citywide';

/** Members visible in Discover after blocking, filters and sorting. */
function useVisibleMembers(state: AppState, quick: CategoryId | 'all') {
  return useMemo(() => {
    const f = state.filters;
    let list = state.members.filter(
      (m) => !state.blockedIds.includes(m.id) && !HIDDEN_FROM_DISCOVER.includes(m.id),
    );
    if (state.filtersApplied) {
      if (f.categories.length) list = list.filter((m) => f.categories.includes(m.category));
      if (f.verifiedOnly) list = list.filter((m) => m.verified);
      list = [...list].sort((a, b) =>
        f.sortBy === 'nearest'
          ? a.distanceKm - b.distanceKm
          : f.sortBy === 'newest'
            ? b.joinedOrder - a.joinedOrder
            : (b.rating ?? 0) - (a.rating ?? 0),
      );
    }
    if (quick !== 'all') list = list.filter((m) => m.category === quick);
    return list;
  }, [state.members, state.blockedIds, state.filters, state.filtersApplied, quick]);
}

/** 16 · Discover (Citywide) and 17 · Discover (Nearby). */
export default function Discover() {
  const router = useRouter();
  const { state } = useApp();
  const [mode, setMode] = useState<Mode>('citywide');
  const [quick, setQuick] = useState<CategoryId | 'all'>('all');
  const members = useVisibleMembers(state, quick);
  const nearby = members.filter((m) => m.distanceKm <= state.filters.distanceKm);
  const hasUnread = state.notifications.some((n) => n.unread);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={t.pageTitle}>Discover</Text>
          <Pressable
            style={styles.city}
            onPress={() => router.push('/auth/city?mode=change')}
            accessibilityRole="button"
            accessibilityLabel={`City: ${myCity(state)}. Change city`}
          >
            <MapPin size={s(17)} color={colors.blue} strokeWidth={2.3} />
            <Text style={styles.cityText}>{myCity(state)}</Text>
            <ChevronDown size={s(16)} color={colors.blue} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Pressable
          style={styles.bell}
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={s(19)} color={colors.ink} strokeWidth={2.2} />
          {hasUnread && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      <Segmented
        style={{ marginHorizontal: TAB_PAD, marginTop: s(14) }}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'nearby', label: 'Nearby' },
          { value: 'citywide', label: 'Citywide' },
        ]}
      />

      {mode === 'citywide' ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.quick}
          >
            <Chip label="All" selected={quick === 'all'} selectedTone="navy" onPress={() => setQuick('all')} />
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.short}
                selected={quick === c.id}
                selectedTone="navy"
                onPress={() => setQuick(quick === c.id ? 'all' : c.id)}
              />
            ))}
            <Chip
              label="Filters"
              onPress={() => router.push('/filters')}
              icon={<SlidersHorizontal size={s(15)} color={colors.ink} strokeWidth={2.2} />}
            />
          </ScrollView>
          <ScrollView contentContainerStyle={styles.list}>
            {members.map((m) => (
              <MemberCard key={m.id} member={m} onPress={() => router.push(`/member/${m.id}`)} />
            ))}
            {members.length === 0 && <Empty onFilters={() => router.push('/filters')} />}
          </ScrollView>
        </>
      ) : (
        <NearbyView members={nearby} maxKm={state.filters.distanceKm} />
      )}
    </Screen>
  );
}

function NearbyView({ members, maxKm }: { members: Member[]; maxKm: number }) {
  const router = useRouter();
  const { state } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(
    members.find((m) => m.id === 'sana')?.id ?? members[0]?.id ?? null,
  );
  const selected = members.find((m) => m.id === selectedId) ?? members[0];

  if (!selected) {
    return (
      <View style={{ flex: 1, padding: TAB_PAD }}>
        <Empty onFilters={() => router.push('/filters')} text={`No members within ${maxKm} km yet.`} />
      </View>
    );
  }

  const rel = relationWith(state, selected.id);
  const onConnect = () => {
    if (rel.status === 'connected' && rel.chatId) router.push(`/chat/${rel.chatId}`);
    else if (rel.status === 'incoming') router.push('/requests');
    else router.push(`/send-request/${selected.id}`);
  };
  const ctaLabel =
    rel.status === 'connected' ? 'Message' : rel.status === 'outgoing' ? 'Requested' : rel.status === 'incoming' ? 'Respond' : 'Connect';

  return (
    <View style={styles.nearby}>
      <Radar members={members} maxKm={maxKm} selectedId={selected.id} onSelect={setSelectedId} />
      <SoftCard radius={s(26)} style={{ marginTop: s(16) }} innerStyle={{ padding: s(16) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar size={s(52)} radius={s(15)} />
          <View style={{ flex: 1, marginLeft: s(14) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.selName} numberOfLines={1}>
                {selected.name}
              </Text>
              {selected.verified && (
                <View style={{ marginLeft: s(6) }}>
                  <VerifiedBadge size={s(19)} />
                </View>
              )}
            </View>
            <Text style={styles.selRole} numberOfLines={1}>
              {selected.role} · {formatDistance(selected.distanceKm, selected.sharesExactDistance)}
            </Text>
          </View>
        </View>
        <View style={styles.selActions}>
          <OutlineButton label="View profile" onPress={() => router.push(`/member/${selected.id}`)} style={{ flex: 1 }} />
          <CompactCta
            label={ctaLabel}
            onPress={onConnect}
            disabled={rel.status === 'outgoing'}
            style={{ flex: 1, marginLeft: s(12) }}
          />
        </View>
      </SoftCard>
    </View>
  );
}

function Empty({ onFilters, text = 'No members match these filters.' }: { onFilters: () => void; text?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[t.bodyInk, { textAlign: 'center' }]}>{text}</Text>
      <Pressable onPress={onFilters} style={{ marginTop: s(10) }}>
        <Text style={t.link}>Adjust filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: TAB_PAD, paddingTop: s(16) },
  city: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginTop: -s(2), alignSelf: 'flex-start' },
  cityText: { fontFamily: fonts.display, fontSize: s(18), color: colors.blue, marginTop: s(2) },
  bell: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(4),
  },
  bellDot: {
    position: 'absolute',
    top: s(8),
    right: s(9),
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    backgroundColor: colors.alert,
  },
  quick: { gap: s(9), paddingHorizontal: TAB_PAD, paddingVertical: s(16) },
  list: { paddingHorizontal: TAB_PAD, paddingBottom: s(24), paddingTop: s(4) },
  nearby: { flex: 1, paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(16) },
  selName: { fontFamily: fonts.display, fontSize: s(18.5), color: colors.ink, flexShrink: 1 },
  selRole: { fontFamily: fonts.body, fontSize: s(15), color: colors.text },
  selActions: { flexDirection: 'row', marginTop: s(14) },
  empty: { alignItems: 'center', paddingVertical: s(40) },
});
