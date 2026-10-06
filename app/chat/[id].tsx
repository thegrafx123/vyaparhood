import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { keys, useChats, useMessages, useSendMessage } from '../../src/api/hooks';
import { EmojiPanel } from '../../src/features/EmojiPanel';
import { BubbleIn, FadeUp, PressScale } from '../../src/motion';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { shortTime } from '../../src/utils/time';
import { MemberPhoto } from '../../src/ui/Avatar';
import { Empty, Loading } from '../../src/ui/Cards';
import { BackButton } from '../../src/ui/Header';
import { Keyboard as KeyboardIcon, Send, Smile, Star } from '../../src/ui/icons';
import { KeyboardArea, Screen } from '../../src/ui/Screen';

/** Only the newest few bubbles slide in; older history just appears. */
const ANIMATE_LAST = 8;

/**
 * 21 · Chat thread. Exists only after a request is accepted — the
 * database refuses messages between members who aren't connected.
 */
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
  const [emoji, setEmoji] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  const selection = useRef({ start: 0, end: 0 });
  // Messages present when the thread opens cascade in; new ones slide in at once.
  const firstBatch = useRef<number | null>(null);
  if (firstBatch.current === null && !isLoading) firstBatch.current = messages.length;

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
        <View style={{ padding: s(20), flexDirection: 'row' }}>
          <BackButton />
        </View>
        {chatsLoading ? <Loading /> : <Empty title="This conversation isn't available" />}
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
        Alert.alert('Message not sent', friendlyError(e));
      },
    });
  };

  const insertEmoji = (e: string) => {
    const { start, end } = selection.current;
    const at = Math.min(start, text.length);
    const next = (text.slice(0, at) + e + text.slice(Math.min(end, text.length))).slice(0, 2000);
    setText(next);
    selection.current = { start: at + e.length, end: at + e.length };
  };

  const toggleEmoji = () => {
    if (emoji) {
      setEmoji(false);
      input.current?.focus();
    } else {
      Keyboard.dismiss();
      setEmoji(true);
    }
  };

  const first = chat.member_name.split(' ')[0];

  return (
    <Screen>
      <KeyboardArea>
        <FadeUp
          delay={20}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: s(12),
            paddingHorizontal: s(20),
            paddingVertical: s(16),
            borderBottomWidth: s(2.5),
            borderBottomColor: colors.ink,
            backgroundColor: colors.white,
          }}
        >
          <BackButton size={s(36)} bg={colors.bg} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${chat.member_name}'s profile`}
            onPress={() => router.push(`/member/${chat.member_id}`)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(12), minWidth: 0 }}
          >
            <MemberPhoto path={chat.member_photo} size={s(42)} radius={s(14)} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: fonts.displayBold, fontSize: s(15), color: colors.ink }}>
                {chat.member_name}
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: s(11.5), color: chat.available ? colors.green : colors.muted }}>
                {chat.available ? 'Connected' : 'No longer available'}
              </Text>
            </View>
          </Pressable>
          {chat.available && (
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={`Rate your meetup with ${chat.member_name}`}
              onPress={() => router.push(`/rate/${chat.member_id}`)}
              style={{
                width: s(36),
                height: s(36),
                borderRadius: s(18),
                backgroundColor: colors.bg,
                borderWidth: s(2),
                borderColor: colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={s(16)} color={colors.ink} fill={colors.star} sw={1.3} />
            </PressScale>
          )}
        </FadeUp>

        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: s(20), gap: s(12) }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setEmoji(false)}
        >
          <FadeUp delay={100} style={{ alignSelf: 'center' }}>
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: s(10.5),
                color: colors.muted,
                backgroundColor: colors.blueSoft,
                paddingHorizontal: s(12),
                paddingVertical: s(4),
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              Connection approved · You can chat now
            </Text>
          </FadeUp>
          {isLoading && <Loading style={{ flex: 0 }} />}
          {messages.map((m, i) => {
            const mine = m.sender_id === userId;
            const last = i === messages.length - 1;
            const nextSame = messages[i + 1]?.sender_id === m.sender_id;
            const initial = firstBatch.current ?? messages.length;
            const animate = i >= initial - ANIMATE_LAST;
            const delay = i < initial ? 160 + Math.max(0, i - (initial - ANIMATE_LAST)) * 60 : 0;
            const bubble = (
              <View
                style={{
                  maxWidth: s(250),
                  paddingVertical: s(11),
                  paddingHorizontal: s(14),
                  borderWidth: s(2),
                  borderColor: colors.ink,
                  backgroundColor: mine ? colors.blue : colors.white,
                  borderRadius: s(18),
                  borderTopLeftRadius: mine ? s(18) : s(4),
                  borderTopRightRadius: mine ? s(4) : s(18),
                }}
              >
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: s(13.5), lineHeight: s(19.5), color: mine ? colors.white : colors.ink }}>
                  {m.body}
                </Text>
              </View>
            );
            return (
              <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {animate ? (
                  <BubbleIn side={mine ? 'right' : 'left'} delay={delay}>
                    {bubble}
                  </BubbleIn>
                ) : (
                  bubble
                )}
                {last || !nextSame ? (
                  <Text style={{ fontFamily: fonts.body, fontSize: s(10.5), color: colors.placeholder, marginTop: s(4), marginHorizontal: s(4) }}>
                    {shortTime(m.created_at)}
                  </Text>
                ) : null}
              </View>
            );
          })}
          {!isLoading && messages.length === 0 && (
            <Text style={[t.meta, { textAlign: 'center' }]}>Say hello to {first} 👋</Text>
          )}
        </ScrollView>

        {chat.available ? (
          <>
            <FadeUp
              delay={380}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: s(10),
                paddingHorizontal: s(16),
                paddingTop: s(14),
                paddingBottom: emoji ? s(10) : Math.max(insets.bottom, s(14)) + s(10),
                backgroundColor: colors.white,
                borderTopWidth: s(2.5),
                borderTopColor: colors.ink,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  backgroundColor: colors.inputBg,
                  borderWidth: s(2),
                  borderColor: colors.ink,
                  borderRadius: s(22),
                  paddingLeft: s(6),
                  paddingRight: s(14),
                  minHeight: s(44),
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={emoji ? 'Show keyboard' : 'Add emoji'}
                  onPress={toggleEmoji}
                  hitSlop={6}
                  style={{ width: s(34), height: s(40), alignItems: 'center', justifyContent: 'center' }}
                >
                  {emoji ? <KeyboardIcon size={s(20)} color={colors.text} /> : <Smile size={s(20)} color={colors.text} />}
                </Pressable>
                <TextInput
                  ref={input}
                  value={text}
                  onChangeText={setText}
                  onSelectionChange={(e) => (selection.current = e.nativeEvent.selection)}
                  onFocus={() => setEmoji(false)}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  maxLength={2000}
                  accessibilityLabel="Message"
                  style={{
                    flex: 1,
                    fontFamily: fonts.bodyMedium,
                    fontSize: s(13.5),
                    color: colors.ink,
                    paddingTop: s(11),
                    paddingBottom: s(11),
                    maxHeight: s(110),
                  }}
                />
              </View>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel="Send"
                onPress={send}
                disabled={!text.trim() || sendMessage.isPending}
                style={{
                  width: s(44),
                  height: s(44),
                  borderRadius: s(22),
                  backgroundColor: colors.lime,
                  borderWidth: s(2.5),
                  borderColor: colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: text.trim() ? 1 : 0.55,
                }}
              >
                <Send size={s(16)} color={colors.ink} />
              </PressScale>
            </FadeUp>
            {emoji && <EmojiPanel onPick={insertEmoji} bottomInset={insets.bottom} />}
          </>
        ) : (
          <View
            style={{
              paddingHorizontal: s(20),
              paddingTop: s(14),
              paddingBottom: Math.max(insets.bottom, s(14)) + s(8),
              borderTopWidth: s(2.5),
              borderTopColor: colors.ink,
              backgroundColor: colors.white,
            }}
          >
            <Text style={[t.meta, { textAlign: 'center' }]}>You can't message this member anymore.</Text>
          </View>
        )}
      </KeyboardArea>
    </Screen>
  );
}
