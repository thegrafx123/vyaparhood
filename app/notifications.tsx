import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import * as api from '../src/api';
import { friendlyError } from '../src/api/errors';
import { keys, useNotifications } from '../src/api/hooks';
import { NotificationRow } from '../src/api/types';
import { FadeUp, PressScale } from '../src/motion';
import { colors, fonts, s, TAB_PAD } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { isToday, timeAgo } from '../src/utils/time';
import { Empty, Loading } from '../src/ui/Cards';
import { HeaderRow } from '../src/ui/Header';
import { Chat, Check, Inbox, Star } from '../src/ui/icons';
import { Screen } from '../src/ui/Screen';

const LOOK: Record<NotificationRow['kind'], { bg: string; icon: React.ReactNode }> = {
  request: { bg: colors.blueSoft2, icon: <Inbox size={s(18)} color={colors.blue} /> },
  approved: { bg: colors.tealSoft, icon: <Check size={s(16)} color={colors.teal} sw={3} /> },
  badge: { bg: colors.yellowSoft, icon: <Star size={s(18)} color={colors.yellow} fill={colors.star} /> },
  message: { bg: colors.orangeSoft, icon: <Chat size={s(18)} color={colors.peach} /> },
};

function Line({ n }: { n: NotificationRow }) {
  const b = (v: string) => <Text style={{ fontFamily: fonts.bodyHeavy }}>{v}</Text>;
  const who = n.actor_name ?? 'A member';
  switch (n.kind) {
    case 'request':
      return <>{b(who)} sent you a connect request</>;
    case 'approved':
      return <>{b(who)} approved your request</>;
    case 'message':
      return <>{b(who)} sent you a message</>;
    default:
      return <>Your profile got a {b('verified badge')}</>;
  }
}

/** 24 · Notifications. Everything is marked read once seen. */
export default function Notifications() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useNotifications();

  useEffect(() => {
    const unread = data.filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) return;
    const id = setTimeout(() => {
      api.notifications
        .markAllRead(unread)
        .then(() => qc.invalidateQueries({ queryKey: keys.notifications }))
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(id);
  }, [data, qc]);

  const today = data.filter((n) => isToday(n.created_at));
  const earlier = data.filter((n) => !isToday(n.created_at));

  const open = (n: NotificationRow) => {
    if (n.kind === 'request') router.push('/requests');
    else if ((n.kind === 'message' || n.kind === 'approved') && n.connection_id) router.push(`/chat/${n.connection_id}`);
    else if (n.kind === 'badge') router.push('/profile');
  };

  let d = 80;
  const next = () => (d = Math.min(d + 50, 480));

  return (
    <Screen>
      <HeaderRow title="Notifications" titleSize={s(22)} pad={TAB_PAD} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(30), gap: s(12) }}>
        {isLoading ? <Loading /> : null}
        {error ? <Empty title="Couldn't load notifications" body={friendlyError(error)} /> : null}
        {!isLoading && !error && data.length === 0 ? (
          <Empty title="You're all caught up" body="Requests, approvals and messages will show up here." />
        ) : null}
        {[
          { label: 'Today', items: today },
          { label: 'Earlier', items: earlier },
        ].map(
          (group, gi) =>
            group.items.length > 0 && (
              <View key={group.label} style={{ gap: s(12) }}>
                <FadeUp delay={next()} style={{ marginTop: gi ? s(10) : s(4), marginHorizontal: s(4) }}>
                  <Text style={[t.sectionLabel, { fontSize: s(11) }]}>{group.label}</Text>
                </FadeUp>
                {group.items.map((n) => (
                  <FadeUp key={n.id} delay={next()}>
                    <PressScale
                      accessibilityRole="button"
                      onPress={() => open(n)}
                      style={{
                        flexDirection: 'row',
                        gap: s(12),
                        padding: s(14),
                        backgroundColor: colors.white,
                        borderWidth: s(2),
                        borderColor: colors.ink,
                        borderRadius: s(18),
                      }}
                    >
                      <View
                        style={{
                          width: s(40),
                          height: s(40),
                          borderRadius: s(12),
                          backgroundColor: LOOK[n.kind].bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {LOOK[n.kind].icon}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bodySemi, fontSize: s(13), lineHeight: s(18), color: colors.ink }}>
                          <Line n={n} />
                        </Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.muted, marginTop: s(3) }}>{timeAgo(n.created_at)}</Text>
                      </View>
                      {!n.read_at && <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: colors.peach, marginTop: s(4) }} />}
                    </PressScale>
                  </FadeUp>
                ))}
              </View>
            ),
        )}
      </ScrollView>
    </Screen>
  );
}
