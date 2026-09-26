import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Inbox, MessageSquare, Star } from '../src/components/icons';
import { HeaderRow, Screen } from '../src/components/Layout';
import { AppNotification, NotificationKind } from '../src/data/sample';
import { useApp } from '../src/state/AppStore';
import { BORDER, colors, fonts, s, TAB_PAD } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

const LOOK: Record<NotificationKind, { bg: string; icon: React.ReactNode }> = {
  request: { bg: colors.blueSoft, icon: <Inbox size={s(20)} color={colors.blue} strokeWidth={2.1} /> },
  approved: { bg: colors.tealSoft, icon: <Check size={s(20)} color={colors.teal} strokeWidth={2.6} /> },
  badge: { bg: colors.yellowSoft, icon: <Star size={s(20)} color={colors.yellow} strokeWidth={2} /> },
  message: { bg: colors.orangeSoft, icon: <MessageSquare size={s(19)} color={colors.peachIcon} strokeWidth={2.1} /> },
};

/** 26 · Notifications. */
export default function Notifications() {
  const router = useRouter();
  const { state, actions } = useApp();

  const open = (n: AppNotification) => {
    actions.markNotificationRead(n.id);
    if (n.kind === 'request') router.navigate('/requests');
    else if (n.chatId && state.chats.some((c) => c.id === n.chatId)) router.push(`/chat/${n.chatId}`);
    else if (n.kind === 'badge') router.push('/settings');
  };

  const section = (key: 'today' | 'earlier', label: string) => {
    const items = state.notifications.filter((n) => n.section === key);
    if (!items.length) return null;
    return (
      <View>
        <Text style={[t.sectionLabel, styles.section]}>{label}</Text>
        {items.map((n) => (
          <Pressable key={n.id} onPress={() => open(n)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
            <View style={[styles.icon, { backgroundColor: LOOK[n.kind].bg }]}>{LOOK[n.kind].icon}</View>
            <View style={{ flex: 1, marginLeft: s(14) }}>
              <Text style={styles.text}>
                {n.boldFirst ? (
                  <>
                    <Text style={styles.bold}>{n.bold}</Text>
                    {n.text}
                  </>
                ) : (
                  <>
                    {n.text}
                    <Text style={styles.bold}>{n.bold}</Text>
                  </>
                )}
              </Text>
              <Text style={styles.time}>{n.time}</Text>
            </View>
            {n.unread && <View style={styles.dot} />}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Screen>
      <HeaderRow title="Notifications" style={{ paddingHorizontal: TAB_PAD }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingBottom: s(30) }}>
        {section('today', 'TODAY')}
        {section('earlier', 'EARLIER')}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: s(24), marginBottom: s(12), marginLeft: s(4) },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: s(26),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: s(16),
    marginBottom: s(12),
  },
  icon: { width: s(42), height: s(42), borderRadius: s(12), alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.bodyMedium, fontSize: s(16.5), lineHeight: s(23), color: colors.ink },
  bold: { fontFamily: fonts.bodyBold },
  time: { fontFamily: fonts.body, fontSize: s(14.5), color: colors.textMuted, marginTop: s(2) },
  dot: { width: s(10), height: s(10), borderRadius: s(5), backgroundColor: colors.alert, marginLeft: s(8), marginTop: s(4) },
});
