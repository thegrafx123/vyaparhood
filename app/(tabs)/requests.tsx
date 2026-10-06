import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useRequests, useRespondRequest, useWithdrawRequest } from '../../src/api/hooks';
import { RequestRow } from '../../src/api/types';
import { FadeUp, PressScale } from '../../src/motion';
import { colors, fonts, s, shadow, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { timeAgo } from '../../src/utils/time';
import { MemberPhoto } from '../../src/ui/Avatar';
import { PillButton } from '../../src/ui/Buttons';
import { Empty, Loading } from '../../src/ui/Cards';
import { Segmented } from '../../src/ui/Form';
import { Screen } from '../../src/ui/Screen';

/** 19 · Requests — incoming (accept / decline) and outgoing (withdraw). */
export default function Requests() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const { data = [], isLoading, error, refetch, isRefetching } = useRequests();
  const incoming = data.filter((r) => r.direction === 'incoming');
  const outgoing = data.filter((r) => r.direction === 'outgoing');
  const list = tab === 'incoming' ? incoming : outgoing;

  return (
    <Screen>
      <FadeUp delay={20} style={{ paddingHorizontal: TAB_PAD, paddingTop: s(22) }}>
        <Text style={t.pageTitle} accessibilityRole="header">
          Requests
        </Text>
      </FadeUp>
      <FadeUp delay={80} style={{ marginHorizontal: TAB_PAD, marginTop: s(16) }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'incoming', label: `Incoming (${incoming.length})` },
            { value: 'outgoing', label: `Outgoing (${outgoing.length})` },
          ]}
        />
      </FadeUp>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(16), paddingBottom: s(30), gap: s(14) }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
      >
        {isLoading ? <Loading /> : null}
        {error ? <Empty title="Couldn't load requests" body={friendlyError(error)} /> : null}
        {!isLoading && !error && list.length === 0 ? (
          <Empty
            title={tab === 'incoming' ? 'No new requests' : 'Nothing pending'}
            body={tab === 'incoming' ? 'When someone wants to connect, their note shows up here.' : 'Requests you send wait here until they reply.'}
          />
        ) : null}
        {list.map((r, i) => (
          <RequestCard key={r.id} r={r} delay={160 + Math.min(i, 6) * 60} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function RequestCard({ r, delay }: { r: RequestRow; delay: number }) {
  const router = useRouter();
  const respond = useRespondRequest();
  const withdraw = useWithdrawRequest();
  const [acting, setActing] = useState<'accept' | 'decline' | null>(null);

  const answer = (accept: boolean) => {
    setActing(accept ? 'accept' : 'decline');
    respond.mutate(
      { requestId: r.id, accept },
      {
        onSuccess: (conn) => {
          if (accept && conn) router.push(`/chat/${conn}`);
        },
        onError: (e) => Alert.alert('Something went wrong', friendlyError(e)),
        onSettled: () => setActing(null),
      },
    );
  };

  return (
    <FadeUp delay={delay}>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: s(2.5),
          borderColor: colors.ink,
          borderRadius: s(20),
          padding: s(14),
          boxShadow: shadow.soft,
        }}
      >
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={`View ${r.member_name}'s profile`}
          onPress={() => router.push(`/member/${r.member_id}`)}
          scaleTo={0.98}
          style={{ flexDirection: 'row', gap: s(12) }}
        >
          <MemberPhoto path={r.member_photo} size={s(48)} radius={s(14)} />
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: s(8) }}>
              <Text numberOfLines={1} style={[t.name, { flexShrink: 1 }]}>
                {r.member_name}
              </Text>
              <Text style={t.small}>{timeAgo(r.created_at)}</Text>
            </View>
            <Text numberOfLines={1} style={t.meta}>
              {r.member_headline}
            </Text>
          </View>
        </PressScale>
        <View style={{ marginTop: s(10), backgroundColor: colors.inputBg, borderRadius: s(12), paddingVertical: s(10), paddingHorizontal: s(12) }}>
          <Text style={{ fontFamily: fonts.body, fontSize: s(12.5), lineHeight: s(17.5), color: colors.text }}>"{r.note}"</Text>
        </View>
        {r.direction === 'incoming' ? (
          <View style={{ flexDirection: 'row', gap: s(8), marginTop: s(12) }}>
            <PillButton label="Decline" style={{ flex: 1 }} loading={acting === 'decline'} disabled={!!acting} onPress={() => answer(false)} />
            <PillButton label="Accept" tone="lime" style={{ flex: 1 }} loading={acting === 'accept'} disabled={!!acting} onPress={() => answer(true)} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: s(8), marginTop: s(12), alignItems: 'center' }}>
            <Text style={[t.small, { flex: 1 }]}>Waiting for {r.member_name.split(' ')[0]} to reply</Text>
            <PillButton
              label="Withdraw"
              loading={withdraw.isPending}
              onPress={() => withdraw.mutate(r.id, { onError: (e) => Alert.alert('Could not withdraw', friendlyError(e)) })}
            />
          </View>
        )}
      </View>
    </FadeUp>
  );
}
