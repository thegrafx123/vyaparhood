import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { keys, useChats, useMessages, useSendMessage } from '../../src/api/hooks';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useAuth } from '../../src/state/AuthProvider';
import { shortTime } from '../../src/utils/time';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Star } from '../../src/components/icons';
import { BackButton, KeyboardArea, Screen } from '../../src/components/Layout';
import { BORDER, colors, fonts, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

/** 23 · Chat thread. Only exists after a request is accepted. */
export default function ChatThread() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const connectionId = String(id);
  const qc = useQueryClient();
  const { userId } = useAuth();
  const { data: chats, isLoading: chatsLoading } = useChats();
  const chat = chats?.find((c) => c.connection_id === connectionId);
  const { data: messages = [], isLoading } = useMessages(connectionId);
  const sendMessage = useSendMessage(connectionId);
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);

  // Mark as read on open and whenever a new message arrives while open.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    api.chat
      .markRead(connectionId)
      .then(() => {
        qc.invalidateQueries({ queryKey: keys.chats });
        qc.invalidateQueries({ queryKey: keys.notifications });
      })
      .catch(() => {});
  }, [connectionId, lastId, qc]);

  if (!chat) {
    return (
      <Screen>
        <View style={{ padding: s(20) }}>
          <BackButton />
          {chatsLoading ? (
            <ActivityIndicator style={{ marginTop: s(40) }} color={colors.blue} />
          ) : (
            <Text style={[t.bodyInk, { marginTop: s(20) }]}>This conversation isn't available.</Text>
          )}
        </View>
      </Screen>
    );
  }

  const send = () => {
    const v = text.trim();
    if (!v || sendMessage.isPending) return;
    setText('');
    sendMessage.mutate(v, {
      onError: (e) => {
        setText(v);
        Alert.alert("Message not sent", friendlyError(e));
      },
    });
  };

  return (
    <Screen>
      <KeyboardArea>
        <View style={styles.header}>
          <BackButton />
          <Pressable style={styles.who} onPress={() => router.push(`/member/${chat.member_id}`)}>
            <MemberAvatar path={chat.member_photo} size={s(42)} radius={s(13)} />
            <View style={{ marginLeft: s(12) }}>
              <Text style={t.name}>{chat.member_name}</Text>
              <Text style={[styles.status, { color: colors.textMuted }]}>View profile</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.star}
            onPress={() => router.push(`/rate/${chat.member_id}`)}
            accessibilityLabel={`Rate your meetup with ${chat.member_name}`}
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
          <View style={styles.system}>
            <Text style={styles.systemText}>Connection approved · You can chat now</Text>
          </View>
          {isLoading && <ActivityIndicator color={colors.blue} />}
          {messages.map((m, i) => {
            const mine = m.sender_id === userId;
            const last = i === messages.length - 1;
            return (
              <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.msg, mine && { color: colors.white }]}>{m.body}</Text>
                </View>
                {last ? <Text style={styles.time}>{shortTime(m.created_at)}</Text> : null}
              </View>
            );
          })}
          {chat.blocked && <Text style={[styles.systemText, { textAlign: 'center' }]}>You can't message this member.</Text>}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, s(10)) + s(4) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            editable={!chat.blocked}
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
