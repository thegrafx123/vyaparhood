import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useDiscover, useMember, useNotifications } from '../../src/api/hooks';
import { DiscoverParams, MemberCardData } from '../../src/api/types';
import { CompactCta, OutlineButton } from '../../src/components/Buttons';
import { Chip, Segmented } from '../../src/components/Controls';
import { VerifiedBadge } from '../../src/components/Hatched';
import { Bell, ChevronDown, MapPin, SlidersHorizontal } from '../../src/components/icons';
import { Screen, SoftCard } from '../../src/components/Layout';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { MemberCard } from '../../src/components/MemberCard';
import { Radar } from '../../src/components/Radar';
import { CATEGORIES, CategoryId } from '../../src/config';
import { formatDistance } from '../../src/services/location';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { BORDER, colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

type Mode = 'nearby' | 'citywide';

/** 16 · Discover (Citywide) and 17 · Discover (Nearby). Data from discover_members(). */
export default function Discover() {
  const router = useRouter();
  const { state } = useApp();
  const { me } = useAuth();
  const [mode, setMode] = useState<Mode>('citywide');
  const [quick, setQuick] = useState<CategoryId | 'all'>('all');
  const f = state.filters;

  const params: DiscoverParams = useMemo(() => {
    const cats = quick !== 'all' ? [quick] : state.filtersApplied ? f.categories : [];
    return {
      mode,
      maxKm: f.distanceKm,
      categories: cats,
      verifiedOnly: state.filtersApplied ? f.verifiedOnly : false,
      sort: mode === 'nearby' ? 'nearest' : state.filtersApplied ? f.sortBy : 'default',
    };
  }, [mode, quick, f, state.filtersApplied]);

  const { data: members = [], isLoading, error, refetch, isRefetching } = useDiscover(params);
  const { data: notifications = [] } = useNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);
  const city = me?.profile.city ?? 'Your city';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={t.pageTitle}>Discover</Text>
          <Pressable
            style={styles.city}
            onPress={() => router.push('/auth/city?mode=change')}
            accessibilityRole="button"
            accessibilityLabel={`City: ${city}. Change city`}
          >
            <MapPin size={s(17)} color={colors.blue} strokeWidth={2.3} />
            <Text style={styles.cityText}>{city}</Text>
            <ChevronDown size={s(16)} color={colors.blue} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Pressable style={styles.bell} onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.quick}>
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
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
          >
            {members.map((m) => (
              <MemberCard key={m.id} member={m} onPress={() => router.push(`/member/${m.id}`)} />
            ))}
            <States loading={isLoading} error={error} empty={!isLoading && !error && members.length === 0} />
          </ScrollView>
        </>
      ) : (
        <NearbyView members={members} maxKm={f.distanceKm} loading={isLoading} error={error} />
      )}
    </Screen>
  );
}

function NearbyView({
  members,
  maxKm,
  loading,
  error,
}: {
  members: MemberCardData[];
  maxKm: number;
  loading: boolean;
  error: unknown;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = members.find((m) => m.id === selectedId) ?? members[0];
  const { data: detail } = useMember(selected?.id);

  if (!selected) {
    return (
      <View style={{ flex: 1, padding: TAB_PAD }}>
        <States
          loading={loading}
          error={error}
          empty={!loading && !error}
          emptyText={`No members within ${maxKm} km yet. Try a wider distance in Filters.`}
        />
      </View>
    );
  }

  const rel = detail?.relation ?? 'none';
  const onConnect = () => {
    if (rel === 'connected' && detail?.connection_id) router.push(`/chat/${detail.connection_id}`);
    else if (rel === 'incoming') router.push('/requests');
    else router.push(`/send-request/${selected.id}`);
  };
  const ctaLabel = rel === 'connected' ? 'Message' : rel === 'outgoing' ? 'Requested' : rel === 'incoming' ? 'Respond' : 'Connect';

  return (
    <View style={styles.nearby}>
      <Radar members={members} maxKm={maxKm} selectedId={selected.id} onSelect={setSelectedId} />
      <SoftCard radius={s(26)} style={{ marginTop: s(16) }} innerStyle={{ padding: s(16) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MemberAvatar path={selected.photo_path} size={s(52)} radius={s(15)} />
          <View style={{ flex: 1, marginLeft: s(14) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.selName} numberOfLines={1}>
                {selected.full_name}
              </Text>
              {selected.verified && (
                <View style={{ marginLeft: s(6) }}>
                  <VerifiedBadge size={s(19)} />
                </View>
              )}
            </View>
            <Text style={styles.selRole} numberOfLines={1}>
              {selected.headline}
              {selected.distance_km != null ? ` · ${formatDistance(selected.distance_km, selected.distance_precise)}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.selActions}>
          <OutlineButton label="View profile" onPress={() => router.push(`/member/${selected.id}`)} style={{ flex: 1 }} />
          <CompactCta label={ctaLabel} onPress={onConnect} disabled={rel === 'outgoing'} style={{ flex: 1, marginLeft: s(12) }} />
        </View>
      </SoftCard>
    </View>
  );
}

function States({
  loading,
  error,
  empty,
  emptyText = 'No members match these filters yet.',
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  emptyText?: string;
}) {
  const router = useRouter();
  if (loading) return <ActivityIndicator style={{ marginTop: s(40) }} color={colors.blue} />;
  if (error) return <Text style={[t.bodyInk, styles.state]}>{friendlyError(error)}</Text>;
  if (!empty) return null;
  return (
    <View style={{ alignItems: 'center', paddingVertical: s(40) }}>
      <Text style={[t.bodyInk, { textAlign: 'center' }]}>{emptyText}</Text>
      <Pressable onPress={() => router.push('/filters')} style={{ marginTop: s(10) }}>
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
  bellDot: { position: 'absolute', top: s(8), right: s(9), width: s(10), height: s(10), borderRadius: s(5), backgroundColor: colors.alert },
  quick: { gap: s(9), paddingHorizontal: TAB_PAD, paddingVertical: s(16) },
  list: { paddingHorizontal: TAB_PAD, paddingBottom: s(24), paddingTop: s(4) },
  nearby: { flex: 1, paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(16) },
  selName: { fontFamily: fonts.display, fontSize: s(18.5), color: colors.ink, flexShrink: 1 },
  selRole: { fontFamily: fonts.body, fontSize: s(15), color: colors.text },
  selActions: { flexDirection: 'row', marginTop: s(14) },
  state: { textAlign: 'center', marginTop: s(40), paddingHorizontal: s(20) },
});
