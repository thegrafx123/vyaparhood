import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { friendlyError } from '../../src/api/errors';
import { useMember, useRespondRequest, useSetSaved, useWithdrawRequest } from '../../src/api/hooks';
import { MemberDetail } from '../../src/api/types';
import { categoryLabel } from '../../src/config';
import { FadeUp, PressScale } from '../../src/motion';
import { formatDistance } from '../../src/services/location';
import { colors, fonts, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { MemberPhoto, VerifiedTick } from '../../src/ui/Avatar';
import { CtaButton, PillButton } from '../../src/ui/Buttons';
import { Empty, Loading } from '../../src/ui/Cards';
import { Tag } from '../../src/ui/Form';
import { BackButton } from '../../src/ui/Header';
import { Bookmark, Dots, Pin } from '../../src/ui/icons';
import { Blob, DotTexture, Screen } from '../../src/ui/Screen';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Mar '24", as in the design. */
const monthYear = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
};

/** 17 · Member profile. Only public fields — never their address or number. */
export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: m, isLoading, error } = useMember(id);
  const setSaved = useSetSaved();

  if (isLoading) return <Loading style={{ backgroundColor: colors.bg }} />;
  if (error || !m) {
    return (
      <Screen>
        <View style={{ paddingHorizontal: s(20), paddingTop: s(20), flexDirection: 'row' }}>
          <BackButton />
        </View>
        <Empty title="This profile isn't available" body={error ? friendlyError(error) : 'They may have left Vyaparhood.'} />
      </Screen>
    );
  }

  const distance = formatDistance(m.distance_km, m.distance_precise);
  const where = [[m.area, m.city].filter(Boolean).join(', '), distance ? `${distance} away` : null].filter(Boolean).join(' · ');

  return (
    <Screen padTop={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: s(130) }} showsVerticalScrollIndicator={false}>
        {/* Cover banner scrolls with the page so the photo can overlap it. */}
        <FadeUp delay={20}>
          <View style={{ height: s(210) + insets.top, backgroundColor: colors.blueSoft, overflow: 'hidden' }}>
            <DotTexture />
            <Blob color={colors.lime} size={s(200)} opacity={0.7} rotate="18deg" style={{ right: -s(60), top: -s(40) }} />
            <Blob color={colors.blue} size={s(140)} opacity={0.12} style={{ left: -s(40), bottom: -s(50) }} />
          </View>
        </FadeUp>

        <View style={{ paddingHorizontal: s(24) }}>
          <FadeUp delay={100} style={{ marginTop: -s(36), flexDirection: 'row' }}>
            <View style={{ borderRadius: s(24), borderWidth: s(3.5), borderColor: colors.bg }}>
              <MemberPhoto path={m.photo_path} size={s(92)} radius={s(21)} />
            </View>
          </FadeUp>

          <FadeUp delay={160} style={{ marginTop: s(12), flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
            <Text style={{ fontFamily: fonts.display, fontSize: s(22), color: colors.ink, flexShrink: 1 }} accessibilityRole="header">
              {m.full_name}
            </Text>
            {m.verified && <VerifiedTick size={s(18)} />}
          </FadeUp>
          <FadeUp delay={200}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: s(14), color: colors.text, marginTop: s(3) }}>{m.headline}</Text>
          </FadeUp>
          {where ? (
            <FadeUp delay={240} style={{ flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: s(6) }}>
              <Pin size={s(12)} color={colors.muted} />
              <Text style={{ fontFamily: fonts.body, fontSize: s(12.5), color: colors.muted }}>{where}</Text>
            </FadeUp>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              gap: s(20),
              marginTop: s(18),
              paddingVertical: s(16),
              borderTopWidth: s(2),
              borderBottomWidth: s(2),
              borderColor: colors.line,
            }}
          >
            <Stat delay={300} value={String(m.connections)} label="Connections" />
            <Stat delay={360} value={monthYear(m.member_since)} label="Member since" />
            <Stat delay={420} value={m.rating ? `${m.rating} ★` : 'New'} label="Community rating" />
          </View>

          {m.bio ? (
            <Section delay={500} title="About">
              <Text style={[t.body, { lineHeight: s(21.6) }]}>{m.bio}</Text>
            </Section>
          ) : null}

          {m.category ? (
            <Section delay={540} title="Category">
              <Tag label={categoryLabel(m.category)} tone="teal" outlined />
            </Section>
          ) : null}

          {m.offers.length ? (
            <Section delay={580} title="Offers">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
                {m.offers.map((o) => (
                  <Tag key={o} label={o} tone="teal" />
                ))}
              </View>
            </Section>
          ) : null}

          {m.looking_for.length ? (
            <Section delay={660} title="Looking for">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
                {m.looking_for.map((o) => (
                  <Tag key={o} label={o} tone="blue" />
                ))}
              </View>
            </Section>
          ) : null}

          {m.social_handle ? (
            <Section delay={700} title="Instagram / LinkedIn">
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(13.5), color: colors.blue }}>@{m.social_handle}</Text>
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {/* Buttons stay on top while the page scrolls. */}
      <FadeUp
        delay={20}
        style={{
          position: 'absolute',
          top: insets.top + s(20),
          left: s(20),
          right: s(20),
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <BackButton />
        <View style={{ flexDirection: 'row', gap: s(10) }}>
          <RoundIcon
            label={m.is_saved ? 'Remove from saved' : 'Save profile'}
            onPress={() => setSaved.mutate({ memberId: m.id, save: !m.is_saved })}
          >
            <Bookmark size={s(16)} color={colors.ink} fill={m.is_saved ? colors.lime : 'none'} />
          </RoundIcon>
          <RoundIcon label="Report or block" onPress={() => router.push(`/report/${m.id}`)}>
            <Dots size={s(16)} color={colors.ink} />
          </RoundIcon>
        </View>
      </FadeUp>

      <FadeUp
        delay={750}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.bg,
          borderTopWidth: s(2.5),
          borderTopColor: colors.ink,
          paddingHorizontal: s(24),
          paddingTop: s(14),
          paddingBottom: Math.max(insets.bottom + s(6), s(28)),
        }}
      >
        <Action m={m} />
      </FadeUp>
    </Screen>
  );
}

function Action({ m }: { m: MemberDetail }) {
  const router = useRouter();
  const withdraw = useWithdrawRequest();
  const respond = useRespondRequest();

  switch (m.relation) {
    case 'connected':
      return <CtaButton label={`Message ${m.full_name.split(' ')[0]}`} icon="send" size="md" onPress={() => router.push(`/chat/${m.connection_id}`)} />;
    case 'outgoing':
      return (
        <View style={{ flexDirection: 'row', gap: s(10), alignItems: 'center' }}>
          <Text style={[t.row, { flex: 1 }]}>Request sent — waiting for them to accept.</Text>
          <PillButton
            label="Withdraw"
            loading={withdraw.isPending}
            onPress={() =>
              m.request_id &&
              withdraw.mutate(m.request_id, { onError: (e) => Alert.alert('Could not withdraw', friendlyError(e)) })
            }
          />
        </View>
      );
    case 'incoming':
      return (
        <View style={{ flexDirection: 'row', gap: s(8) }}>
          <PillButton
            label="Decline"
            size="lg"
            style={{ flex: 1 }}
            onPress={() => m.request_id && respond.mutate({ requestId: m.request_id, accept: false })}
          />
          <PillButton
            label="Accept"
            tone="lime"
            size="lg"
            style={{ flex: 1 }}
            loading={respond.isPending}
            onPress={() =>
              m.request_id &&
              respond.mutate(
                { requestId: m.request_id, accept: true },
                {
                  onSuccess: (conn) => conn && router.push(`/chat/${conn}`),
                  onError: (e) => Alert.alert('Could not accept', friendlyError(e)),
                },
              )
            }
          />
        </View>
      );
    case 'blocked':
      return <Text style={[t.row, { textAlign: 'center' }]}>You've blocked this member. Unblock them in Settings.</Text>;
    default:
      return <CtaButton label="Send request" size="md" onPress={() => router.push(`/send-request/${m.id}`)} />;
  }
}

function RoundIcon({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={{
        width: s(40),
        height: s(40),
        borderRadius: s(20),
        backgroundColor: colors.white,
        borderWidth: s(2.5),
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </PressScale>
  );
}

function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <FadeUp delay={delay}>
      <Text style={{ fontFamily: fonts.display, fontSize: s(17), color: colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.muted }}>{label}</Text>
    </FadeUp>
  );
}

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <FadeUp delay={delay} style={{ marginTop: s(18) }}>
      <Text style={[t.label, { marginBottom: s(8) }]}>{title}</Text>
      {children}
    </FadeUp>
  );
}
