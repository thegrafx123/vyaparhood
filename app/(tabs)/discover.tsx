import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { keys, useDiscover, useDiscoveryContext, useNotifications } from '../../src/api/hooks';
import { DiscoverParams, MemberCardData } from '../../src/api/types';
import { CATEGORIES } from '../../src/config';
import { MemberCard } from '../../src/features/MemberCard';
import { Radar } from '../../src/features/Radar';
import { refreshLiveLocation } from '../../src/lib/liveLocation';
import { FadeUp, Ping, PressScale } from '../../src/motion';
import { formatDistance, getPermission, requestPermission } from '../../src/services/location';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, s, shadow, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { MemberPhoto, VerifiedTick } from '../../src/ui/Avatar';
import { CtaButton, PillButton, SmallCta } from '../../src/ui/Buttons';
import { Empty, Loading } from '../../src/ui/Cards';
import { Segmented } from '../../src/ui/Form';
import { Bell, ChevronDown, Filters, Pin } from '../../src/ui/icons';
import { Screen } from '../../src/ui/Screen';

/**
 * 15 · Discover (Citywide list) and 15b · Nearby (radar).
 * Nearby searches around the member's live location (or their business
 * address when location is off) and finds other businesses by THEIR
 * business address.
 */
export default function Discover() {
  const router = useRouter();
  const qc = useQueryClient();
  const { state, actions } = useApp();
  const { me } = useAuth();
  const mode = state.discoverMode;
  const f = state.filters;
  const { data: context } = useDiscoveryContext();

  const city = state.discoverCity ?? context?.live_city ?? me?.profile.city ?? null;

  const params: DiscoverParams = useMemo(
    () => ({
      mode,
      city: mode === 'citywide' ? city : null,
      maxKm: f.distanceKm,
      categories: f.categories,
      verifiedOnly: f.verifiedOnly,
      sort: f.sortBy,
    }),
    [mode, city, f],
  );

  const { data: members = [], isLoading, error, refetch, isRefetching } = useDiscover(params);
  const { data: notifications = [] } = useNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  // A fresh live location changes both the search origin and the distances.
  useEffect(() => {
    if (state.live.status === 'granted') {
      qc.invalidateQueries({ queryKey: keys.context });
      qc.invalidateQueries({ queryKey: ['discover'] });
    }
  }, [state.live.coords?.lat, state.live.coords?.lng, state.live.status, qc]);

  const quickAll = f.categories.length === 0;
  const setQuick = (id: (typeof CATEGORIES)[number]['id'] | null) =>
    actions.applyFilters({ ...f, categories: id ? (f.categories.length === 1 && f.categories[0] === id ? [] : [id]) : [] });

  return (
    <Screen>
      <FadeUp delay={20} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: TAB_PAD, paddingTop: s(22) }}>
        <View>
          <Text style={t.pageTitle} accessibilityRole="header">
            Discover
          </Text>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={`City: ${city ?? 'not set'}. Change city`}
            onPress={() => router.push('/city-select')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: s(2) }}
          >
            <Pin size={s(13)} color={colors.blue} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(13), color: colors.blue }}>{city ?? 'Choose city'}</Text>
            <ChevronDown size={s(11)} color={colors.blue} />
          </PressScale>
        </View>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={hasUnread ? 'Notifications, unread' : 'Notifications'}
          onPress={() => router.push('/notifications')}
          style={{
            width: s(44),
            height: s(44),
            borderRadius: s(22),
            backgroundColor: colors.white,
            borderWidth: s(2.5),
            borderColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={s(18)} color={colors.ink} />
          {hasUnread && (
            <Ping size={s(13)} color={colors.peach} style={{ position: 'absolute', top: s(4), right: s(6) }}>
              <View style={{ width: s(13), height: s(13), borderRadius: s(7), backgroundColor: colors.peach, borderWidth: s(2), borderColor: colors.white }} />
            </Ping>
          )}
        </PressScale>
      </FadeUp>

      <FadeUp delay={60} style={{ marginHorizontal: TAB_PAD, marginTop: s(16) }}>
        <Segmented
          value={mode}
          onChange={actions.setDiscoverMode}
          options={[
            { value: 'nearby', label: 'Nearby' },
            { value: 'citywide', label: 'Citywide' },
          ]}
        />
      </FadeUp>

      <FadeUp delay={100}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginTop: s(14) }}
          contentContainerStyle={{ gap: s(8), paddingHorizontal: TAB_PAD, paddingBottom: s(4), alignItems: 'center' }}
        >
          <QuickChip label="All" selected={quickAll} onPress={() => setQuick(null)} />
          {CATEGORIES.map((c) => (
            <QuickChip key={c.id} label={c.short} selected={f.categories.length === 1 && f.categories[0] === c.id} onPress={() => setQuick(c.id)} />
          ))}
          <PressScale
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={() => router.push('/filters')}
            style={{ width: s(34), height: s(34), borderRadius: s(17), backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <Filters size={s(14)} color={colors.white} />
          </PressScale>
        </ScrollView>
      </FadeUp>

      {mode === 'citywide' ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(16), paddingBottom: s(30), gap: s(14) }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
        >
          {members.map((m, i) => (
            <MemberCard key={m.id} member={m} delay={160 + Math.min(i, 8) * 60} onPress={() => router.push(`/member/${m.id}`)} />
          ))}
          {isLoading ? <Loading /> : null}
          {error ? <Empty title="Couldn't load members" body={friendlyError(error)} action={<PillButton label="Try again" onPress={() => refetch()} />} /> : null}
          {!isLoading && !error && members.length === 0 ? (
            <Empty
              title={`No one here yet${city ? ` in ${city}` : ''}`}
              body={f.categories.length || f.verifiedOnly ? 'Try removing a filter.' : 'Invite a business owner you know — the network grows one person at a time.'}
            />
          ) : null}
        </ScrollView>
      ) : (
        <Nearby members={members} maxKm={f.distanceKm} loading={isLoading} error={error} origin={context?.origin ?? 'none'} />
      )}
    </Screen>
  );
}

function QuickChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingVertical: s(8),
        paddingHorizontal: s(16),
        borderRadius: 999,
        backgroundColor: selected ? colors.ink : colors.white,
        borderWidth: s(2),
        borderColor: colors.ink,
      }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(12.5), color: selected ? colors.white : colors.ink }}>{label}</Text>
    </PressScale>
  );
}

function Nearby({
  members,
  maxKm,
  loading,
  error,
  origin,
}: {
  members: MemberCardData[];
  maxKm: number;
  loading: boolean;
  error: unknown;
  origin: 'live' | 'business' | 'none';
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { actions } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const selected = members.find((m) => m.id === selectedId) ?? members[0] ?? null;
  // The card rises in after the pins on first show (design: 0.55s), then quickly on each tap.
  const cardDelay = selectedId ? 60 : 550;

  const useMyLocation = async () => {
    setAsking(true);
    try {
      let p = await getPermission();
      if (p.status !== 'granted' && p.canAskAgain) p = await requestPermission();
      if (p.status !== 'granted') {
        await Linking.openSettings();
        return;
      }
      await refreshLiveLocation({ signedIn: true, onFix: actions.setLive });
      qc.invalidateQueries({ queryKey: keys.context });
      qc.invalidateQueries({ queryKey: ['discover'] });
    } finally {
      setAsking(false);
    }
  };

  if (origin === 'none') {
    return (
      <Empty
        title="Turn on location to see who's nearby"
        body="Nearby shows businesses around where you are right now. Citywide works without it."
        action={<CtaButton label="Use my location" onPress={useMyLocation} loading={asking} size="md" />}
      />
    );
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: TAB_PAD, paddingTop: s(14), paddingBottom: s(12) }}>
      {origin === 'business' && (
        <Pressable onPress={useMyLocation} style={{ marginBottom: s(8) }} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted }}>
            Showing distances from your business address.{' '}
            <Text style={{ fontFamily: fonts.bodyBold, color: colors.blue }}>Use my location</Text>
          </Text>
        </Pressable>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <Empty title="Couldn't load nearby members" body={friendlyError(error)} />
      ) : (
        <>
          <Radar members={members.slice(0, 12)} maxKm={maxKm} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
          {selected ? (
            <FadeUp key={selected.id} delay={cardDelay} style={{ marginTop: s(14) }}>
              <View
                style={{
                  backgroundColor: colors.white,
                  borderWidth: s(2.5),
                  borderColor: colors.ink,
                  borderRadius: s(18),
                  padding: s(14),
                  boxShadow: shadow.soft,
                }}
              >
                <View style={{ flexDirection: 'row', gap: s(12), alignItems: 'center' }}>
                  <MemberPhoto path={selected.photo_path} size={s(52)} radius={s(16)} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
                      <Text numberOfLines={1} style={{ fontFamily: fonts.displayBold, fontSize: s(15), color: colors.ink, flexShrink: 1 }}>
                        {selected.full_name}
                      </Text>
                      {selected.verified && <VerifiedTick size={s(16)} />}
                    </View>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: s(12), color: colors.text, marginTop: s(2) }}>
                      {[selected.headline, formatDistance(selected.distance_km, selected.distance_precise)].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: s(8), marginTop: s(12) }}>
                  <PillButton label="View profile" onPress={() => router.push(`/member/${selected.id}`)} style={{ flex: 1 }} />
                  <SmallCta label="Connect" onPress={() => router.push(`/send-request/${selected.id}`)} style={{ flex: 1.2 }} />
                </View>
              </View>
            </FadeUp>
          ) : (
            <Text style={[t.meta, { textAlign: 'center', marginTop: s(14) }]}>
              No businesses within {maxKm} km yet. Widen the distance in Filters.
            </Text>
          )}
        </>
      )}
    </View>
  );
}
