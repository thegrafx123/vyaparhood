import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useChats } from '../../src/api/hooks';
import { FadeUp, PressScale } from '../../src/motion';
import { colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { shortTime } from '../../src/utils/time';
import { MemberPhoto } from '../../src/ui/Avatar';
import { Empty, Loading } from '../../src/ui/Cards';
import { Field } from '../../src/ui/Form';
import { Search } from '../../src/ui/icons';
import { Screen } from '../../src/ui/Screen';

/** 20 · Chats — one per accepted connection. */
export default function Chats() {
  const router = useRouter();
  const { data = [], isLoading, error, refetch, isRefetching } = useChats();
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? data.filter((c) => c.member_name.toLowerCase().includes(q) || (c.last_body ?? '').toLowerCase().includes(q)) : data;
  }, [data, query]);

  return (
    <Screen>
      <FadeUp delay={20} style={{ paddingHorizontal: TAB_PAD, paddingTop: s(22) }}>
        <Text style={t.pageTitle} accessibilityRole="header">
          Chats
        </Text>
      </FadeUp>
      <FadeUp delay={80} style={{ paddingHorizontal: TAB_PAD, paddingTop: s(16) }}>
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats"
          left={<Search size={s(16)} color={colors.text} />}
          boxStyle={{ borderRadius: s(16) }}
          returnKeyType="search"
          accessibilityLabel="Search chats"
        />
      </FadeUp>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: s(14), paddingTop: s(10), paddingBottom: s(30), gap: s(4) }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? <Loading /> : null}
        {error ? <Empty title="Couldn't load chats" body={friendlyError(error)} /> : null}
        {!isLoading && !error && data.length === 0 ? (
          <Empty title="No chats yet" body="Chat unlocks when someone accepts your request — or you accept theirs." />
        ) : null}
        {list.map((c, i) => (
          <FadeUp key={c.connection_id} delay={160 + Math.min(i, 8) * 50}>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${c.member_name}${c.unread ? ', unread' : ''}`}
              onPress={() => router.push(`/chat/${c.connection_id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: s(12), padding: s(12), borderRadius: s(18) }}
            >
              <MemberPhoto path={c.member_photo} size={s(52)} radius={s(16)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: s(8) }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.displayBold, fontSize: s(14.5), color: colors.ink, flexShrink: 1 }}>
                    {c.member_name}
                  </Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.muted }}>{shortTime(c.last_at)}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: c.unread ? fonts.bodyBold : fonts.body,
                    fontSize: s(12.5),
                    color: c.unread ? colors.ink : colors.text,
                    marginTop: s(2),
                  }}
                >
                  {!c.available
                    ? 'This member is no longer available'
                    : c.last_body
                      ? `${c.last_sender_is_me ? 'You: ' : ''}${c.last_body}`
                      : 'Say hello 👋'}
                </Text>
              </View>
              {c.unread && <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: colors.peach }} />}
            </PressScale>
          </FadeUp>
        ))}
      </ScrollView>
    </Screen>
  );
}
