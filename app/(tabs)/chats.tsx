import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useChats } from '../../src/api/hooks';
import { Search } from '../../src/components/icons';
import { Screen } from '../../src/components/Layout';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { BORDER, colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { shortTime } from '../../src/utils/time';

/** 22 · Chats. Only accepted connections appear here. Live via Supabase Realtime. */
export default function Chats() {
  const router = useRouter();
  const { data = [], isLoading, refetch, isRefetching } = useChats();
  const [q, setQ] = useState('');

  const rows = data
    .map((c) => ({ ...c, preview: c.last_body ? (c.last_sender_is_me ? `You: ${c.last_body}` : c.last_body) : 'Say hi 👋' }))
    .filter((r) => !q || r.member_name.toLowerCase().includes(q.toLowerCase()) || r.preview.toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen>
      <Text style={[t.pageTitle, styles.title]}>Chats</Text>
      <View style={styles.search}>
        <Search size={s(20)} color={colors.text} strokeWidth={2.2} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search chats" placeholderTextColor={colors.placeholder} style={styles.searchInput} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(14) }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
      >
        {isLoading && <ActivityIndicator style={{ marginTop: s(30) }} color={colors.blue} />}
        {rows.map((c) => (
          <Pressable
            key={c.connection_id}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => router.push(`/chat/${c.connection_id}`)}
          >
            <MemberAvatar path={c.member_photo} size={s(52)} radius={s(15)} />
            <View style={{ flex: 1, marginLeft: s(14) }}>
              <View style={styles.line}>
                <Text style={[t.name, { flex: 1 }]} numberOfLines={1}>
                  {c.member_name}
                </Text>
                <Text style={styles.time}>{shortTime(c.last_at)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {c.preview}
              </Text>
            </View>
            {c.unread ? <View style={styles.unread} /> : <View style={{ width: s(10) }} />}
          </Pressable>
        ))}
        {!isLoading && rows.length === 0 && (
          <Text style={[t.bodyInk, { textAlign: 'center', marginTop: s(40) }]}>
            {q ? 'No chats match that search.' : 'Chats appear here once someone accepts your request.'}
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: TAB_PAD, paddingTop: s(16) },
  search: {
    marginHorizontal: TAB_PAD,
    marginTop: s(14),
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: s(12) },
  line: { flexDirection: 'row', alignItems: 'center' },
  time: { fontFamily: fonts.body, fontSize: s(14), color: colors.textMuted, marginLeft: s(8) },
  preview: { fontFamily: fonts.body, fontSize: s(16), color: '#4B5770', marginTop: s(1) },
  unread: { width: s(9), height: s(9), borderRadius: s(5), backgroundColor: colors.alert, marginLeft: s(10) },
});
