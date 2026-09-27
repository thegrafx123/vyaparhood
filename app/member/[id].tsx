import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { friendlyError } from '../../src/api/errors';
import { useMember, useSetSaved, useSignedUrl } from '../../src/api/hooks';
import { PrimaryButton } from '../../src/components/Buttons';
import { Tag } from '../../src/components/Controls';
import { Hatched, VerifiedBadge } from '../../src/components/Hatched';
import { Ellipsis, MapPin, Star } from '../../src/components/icons';
import { BackButton, Divider, Footer, Screen } from '../../src/components/Layout';
import { ShadowBox } from '../../src/components/ShadowBox';
import { formatDistance } from '../../src/services/location';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

const monthYear = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleString('en-IN', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
};

/** 19 · Member profile (get_member RPC — no private fields ever leave the server). */
export default function MemberProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: m, isLoading, error } = useMember(String(id));
  const setSaved = useSetSaved();
  const photo = useSignedUrl('avatars', m?.photo_path);

  if (isLoading || !m) {
    return (
      <Screen>
        <View style={{ padding: H_PAD }}>
          <BackButton />
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: s(40) }} color={colors.blue} />
          ) : (
            <Text style={[t.bodyInk, { marginTop: s(20) }]}>{error ? friendlyError(error) : "This profile isn't available."}</Text>
          )}
        </View>
      </Screen>
    );
  }

  const openMore = () => {
    const saveLabel = m.is_saved ? 'Remove from saved' : 'Save profile';
    const run = (i: number) => {
      if (i === 0) setSaved.mutate({ memberId: m.id, save: !m.is_saved });
      if (i === 1) router.push(`/report/${m.id}`);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [saveLabel, 'Report or block', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        run,
      );
    } else {
      Alert.alert(m.full_name, undefined, [
        { text: saveLabel, onPress: () => run(0) },
        { text: 'Report or block', style: 'destructive', onPress: () => run(1) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const cta = (() => {
    switch (m.relation) {
      case 'connected':
        return { label: 'Message', onPress: () => router.push(`/chat/${m.connection_id}`), disabled: false };
      case 'outgoing':
        return { label: 'Request sent', onPress: () => {}, disabled: true };
      case 'incoming':
        return { label: 'Respond to request', onPress: () => router.push('/requests'), disabled: false };
      case 'blocked':
        return { label: 'Blocked', onPress: () => {}, disabled: true };
      default:
        return { label: 'Send request', onPress: () => router.push(`/send-request/${m.id}`), disabled: false };
    }
  })();

  return (
    <Screen padTop={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: s(20) }}>
        <Hatched radius={0} iconSize={s(30)} style={[styles.cover, { height: s(190) + insets.top }]} />
        <View style={[styles.topButtons, { top: insets.top + s(8) }]}>
          <BackButton bg={colors.white} />
          <Pressable style={styles.more} onPress={openMore} accessibilityLabel="More options" hitSlop={8}>
            <Ellipsis size={s(20)} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        </View>
        <ShadowBox radius={s(22)} color={colors.shadowSoft} offset={{ x: s(3), y: s(4) }} style={styles.avatarWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={[styles.avatar, { borderRadius: s(22) }]} />
          ) : (
            <Hatched radius={s(22)} dashed={false} iconSize={s(24)} style={styles.avatar} />
          )}
        </ShadowBox>

        <View style={styles.body}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.name}>{m.full_name}</Text>
            {m.verified && (
              <View style={{ marginLeft: s(8) }}>
                <VerifiedBadge size={s(22)} />
              </View>
            )}
          </View>
          <Text style={styles.role}>{m.headline}</Text>
          <View style={styles.locRow}>
            <MapPin size={s(15)} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.loc}>
              {[m.area, m.city].filter(Boolean).join(', ')}
              {m.distance_km != null ? ` · ${formatDistance(m.distance_km, m.distance_precise)} away` : ''}
            </Text>
          </View>

          <Divider style={{ marginTop: s(18) }} />
          <View style={styles.stats}>
            <Stat value={String(m.connections)} label="Connections" />
            <Stat value={monthYear(m.member_since)} label="Member since" />
            <Stat
              value={m.rating != null ? Number(m.rating).toFixed(1) : 'New'}
              label="Community rating"
              icon={m.rating != null ? <Star size={s(17)} color={colors.ink} fill={colors.ink} /> : undefined}
            />
          </View>
          <Divider />

          {m.bio ? (
            <>
              <Text style={[t.label, { marginTop: s(20) }]}>About</Text>
              <Text style={[t.body, { fontSize: s(16.5), lineHeight: s(25), marginTop: s(6) }]}>{m.bio}</Text>
            </>
          ) : null}

          {m.offers.length > 0 && (
            <>
              <Text style={[t.label, { marginTop: s(18), marginBottom: s(10) }]}>Offers</Text>
              <View style={styles.tags}>
                {m.offers.map((o) => (
                  <Tag key={o} label={o} tone="teal" style={styles.bigTag} />
                ))}
              </View>
            </>
          )}
          {m.looking_for.length > 0 && (
            <>
              <Text style={[t.label, { marginTop: s(16), marginBottom: s(10) }]}>Looking for</Text>
              <View style={styles.tags}>
                {m.looking_for.map((o) => (
                  <Tag key={o} label={o} tone="blue" style={styles.bigTag} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <Footer style={styles.footer}>
        <PrimaryButton label={cta.label} onPress={cta.onPress} disabled={cta.disabled} />
      </Footer>
    </Screen>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <View style={{ marginRight: s(34) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(4) }}>
        <Text style={styles.statValue}>{value}</Text>
        {icon}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const AV = s(84);
const styles = StyleSheet.create({
  cover: { width: '100%', borderBottomWidth: BORDER, borderStyle: 'dashed', borderColor: colors.blue },
  topButtons: { position: 'absolute', left: s(20), right: s(20), flexDirection: 'row', justifyContent: 'space-between' },
  more: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: { marginLeft: H_PAD, marginTop: -AV / 2, width: AV, height: AV },
  avatar: { width: AV, height: AV, borderWidth: s(3), borderColor: colors.bg },
  body: { paddingHorizontal: H_PAD, paddingTop: s(18) },
  name: { fontFamily: fonts.display, fontSize: s(27), color: colors.ink, lineHeight: s(34), flexShrink: 1 },
  role: { fontFamily: fonts.bodyBold, fontSize: s(17), color: '#5F6D8A', marginTop: s(2) },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(6) },
  loc: { fontFamily: fonts.body, fontSize: s(15), color: colors.textMuted },
  stats: { flexDirection: 'row', paddingVertical: s(16) },
  statValue: { fontFamily: fonts.display, fontSize: s(20), color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: s(14), color: colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
  bigTag: { height: s(34), borderRadius: s(17), paddingHorizontal: s(16) },
  footer: { borderTopWidth: BORDER, borderTopColor: colors.ink, backgroundColor: colors.bg },
});
