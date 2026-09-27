import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useRequests, useRespondRequest, useWithdrawRequest } from '../../src/api/hooks';
import { RequestRow } from '../../src/api/types';
import { OutlineButton } from '../../src/components/Buttons';
import { Segmented } from '../../src/components/Controls';
import { Screen, SoftCard } from '../../src/components/Layout';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { timeAgo } from '../../src/utils/time';
import { firstName } from '../../src/utils/validation';

/** 21 · Requests. Accepting creates the connection and opens the chat. */
export default function Requests() {
  const router = useRouter();
  const { data = [], isLoading, refetch, isRefetching } = useRequests();
  const respond = useRespondRequest();
  const withdraw = useWithdrawRequest();
  const incoming = data.filter((r) => r.direction === 'incoming');
  const outgoing = data.filter((r) => r.direction === 'outgoing');
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const list = tab === 'incoming' ? incoming : outgoing;

  const accept = (r: RequestRow) =>
    respond.mutate(
      { requestId: r.id, accept: true },
      {
        onSuccess: (connectionId) => connectionId && router.push(`/chat/${connectionId}`),
        onError: (e) => Alert.alert("Couldn't accept", friendlyError(e)),
      },
    );

  return (
    <Screen>
      <Text style={[t.pageTitle, styles.title]}>Requests</Text>
      <Segmented
        style={{ marginHorizontal: TAB_PAD, marginTop: s(14) }}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'incoming', label: `Incoming (${incoming.length})` },
          { value: 'outgoing', label: `Outgoing (${outgoing.length})` },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
      >
        {isLoading && <ActivityIndicator style={{ marginTop: s(30) }} color={colors.blue} />}
        {list.map((r) => (
          <SoftCard key={r.id} radius={s(26)} style={{ marginBottom: s(16) }} innerStyle={{ padding: s(16) }}>
            <Pressable style={styles.row} onPress={() => router.push(`/member/${r.member_id}`)}>
              <MemberAvatar path={r.member_photo} size={s(48)} radius={s(14)} />
              <View style={{ flex: 1, marginLeft: s(14) }}>
                <Text style={t.name}>{r.member_name}</Text>
                <Text style={styles.role}>{r.member_headline}</Text>
              </View>
            </Pressable>
            <View style={styles.note}>
              <Text style={styles.noteText}>"{r.note}"</Text>
            </View>
            {r.direction === 'incoming' ? (
              <View style={styles.actions}>
                <OutlineButton
                  label="Decline"
                  onPress={() => respond.mutate({ requestId: r.id, accept: false })}
                  style={{ flex: 1 }}
                />
                <OutlineButton label="Accept" fill={colors.lime} onPress={() => accept(r)} style={{ flex: 1, marginLeft: s(12) }} />
              </View>
            ) : (
              <View style={[styles.actions, { alignItems: 'center' }]}>
                <Text style={[t.helper, { flex: 1, fontSize: s(13.5) }]}>
                  Waiting for {firstName(r.member_name)} · {timeAgo(r.created_at)}
                </Text>
                <OutlineButton label="Withdraw" height={s(40)} onPress={() => withdraw.mutate(r.id)} />
              </View>
            )}
          </SoftCard>
        ))}
        {!isLoading && list.length === 0 && (
          <View style={styles.empty}>
            <Text style={[t.bodyInk, { textAlign: 'center' }]}>
              {tab === 'incoming'
                ? 'No new requests. Members who want to connect will show up here.'
                : "You haven't sent any requests yet."}
            </Text>
            {tab === 'outgoing' && (
              <Pressable onPress={() => router.navigate('/discover')} style={{ marginTop: s(10) }}>
                <Text style={t.link}>Find people on Discover</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: TAB_PAD, paddingTop: s(16) },
  list: { paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(24) },
  row: { flexDirection: 'row', alignItems: 'center' },
  role: { fontFamily: fonts.body, fontSize: s(15), color: colors.text },
  note: { backgroundColor: '#F1F5FD', borderRadius: s(16), padding: s(14), marginTop: s(14) },
  noteText: { fontFamily: fonts.body, fontSize: s(15.5), lineHeight: s(22), color: '#4A5670' },
  actions: { flexDirection: 'row', marginTop: s(14) },
  empty: { paddingVertical: s(40), paddingHorizontal: s(20), alignItems: 'center' },
});
