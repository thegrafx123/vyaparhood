import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Hatched';
import { Send, Star } from '../../src/components/icons';
import { BackButton, KeyboardArea, Screen } from '../../src/components/Layout';
import { getMember, useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

/** 23 · Chat thread. Only exists after a request is accepted. */
export default function ChatThread() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useApp();
  const chat = state.chats.find((c) => c.id === String(id));
  const member = chat ? getMember(state, chat.memberId) : undefined;
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (chat?.unread) actions.markChatRead(chat.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id]);

  if (!chat || !member) {
    return (
      <Screen>
        <View style={{ padding: s(20) }}>
          <BackButton />
          <Text style={[t.bodyInk, { marginTop: s(20) }]}>This conversation isn't available.</Text>
        </View>
      </Screen>
    );
  }

  const send = () => {
    const v = text.trim();
    if (!v) return;
    actions.sendMessage(chat.id, v);
    setText('');
  };

  return (
    <Screen>
      <KeyboardArea>
        <View style={styles.header}>
          <BackButton />
          <Pressable style={styles.who} onPress={() => router.push(`/member/${member.id}`)}>
            <Avatar size={s(42)} radius={s(13)} online={chat.online} />
            <View style={{ marginLeft: s(12) }}>
              <Text style={t.name}>{member.name}</Text>
              <Text style={[styles.status, !chat.online && { color: colors.textMuted }]}>
                {chat.online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.star}
            onPress={() => router.push(`/rate/${member.id}`)}
            accessibilityLabel={`Rate your meetup with ${member.name}`}
          >
            <Star size={s(19)} color={colors.ink} fill={colors.star} strokeWidth={1.8} />
          </Pressable>
        </View>

        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {chat.messages.map((m) =>
            m.from === 'system' ? (
              <View key={m.id} style={styles.system}>
                <Text style={styles.systemText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={{ alignItems: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, m.from === 'me' ? styles.mine : styles.theirs]}>
                  <Text style={[styles.msg, m.from === 'me' && { color: colors.white }]}>{m.text}</Text>
                </View>
                {m.time ? <Text style={styles.time}>{m.time}</Text> : null}
              </View>
            ),
          )}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, s(10)) + s(4) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={({ pressed }) => [styles.send, (pressed || !text.trim()) && { opacity: 0.6 }]}
            onPress={send}
            disabled={!text.trim()}
            accessibilityLabel="Send message"
          >
            <Send size={s(20)} color={colors.ink} strokeWidth={2.3} />
          </Pressable>
        </View>
      </KeyboardArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: s(8),
    paddingBottom: s(14),
    borderBottomWidth: BORDER,
    borderBottomColor: colors.ink,
    backgroundColor: colors.white,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: s(12) },
  status: { fontFamily: fonts.bodyMedium, fontSize: s(15), color: colors.online },
  star: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: { padding: s(20), paddingTop: s(18) },
  system: {
    alignSelf: 'center',
    backgroundColor: colors.blueSoft,
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
    marginBottom: s(14),
  },
  systemText: { fontFamily: fonts.bodyBold, fontSize: s(13), color: '#818D9D' },
  bubble: {
    maxWidth: '76%',
    borderRadius: s(20),
    borderWidth: BORDER,
    borderColor: colors.ink,
    paddingHorizontal: s(16),
    paddingVertical: s(13),
    marginBottom: s(12),
  },
  theirs: { backgroundColor: colors.white },
  mine: { backgroundColor: colors.blue },
  msg: { fontFamily: fonts.body, fontSize: s(16.5), lineHeight: s(23), color: colors.ink },
  time: { fontFamily: fonts.body, fontSize: s(13), color: colors.placeholder, marginTop: -s(6), marginBottom: s(10), marginHorizontal: s(4) },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: BORDER,
    borderTopColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: s(16),
    paddingTop: s(12),
  },
  input: {
    flex: 1,
    minHeight: s(48),
    maxHeight: s(120),
    borderRadius: s(24),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.inputBg,
    paddingHorizontal: s(18),
    paddingTop: s(13),
    paddingBottom: s(12),
    fontFamily: fonts.body,
    fontSize: s(16.5),
    color: colors.ink,
  },
  send: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(12),
  },
});
