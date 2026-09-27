import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Hatched } from '../../src/components/Hatched';
import { Check, ChevronRight, Settings } from '../../src/components/icons';
import { Divider, Screen } from '../../src/components/Layout';
import { ShadowBox } from '../../src/components/ShadowBox';
import { categoryLabel, SUPPORT_EMAIL } from '../../src/config';
import { useSignedUrl, useStats } from '../../src/api/hooks';
import { useAuth } from '../../src/state/AuthProvider';
import { BORDER, colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

/** 27 · My profile. */
export default function MyProfile() {
  const router = useRouter();
  const { me } = useAuth();
  const { data: st } = useStats();
  const p = me?.profile;
  const photo = useSignedUrl('avatars', p?.photo_path);
  if (!p) return null;
  const subtitle = [p.headline || p.building, p.city].filter(Boolean).join(' · ');

  const stats = [
    { value: String(st?.connections ?? '—'), label: 'Connections' },
    { value: String(st?.requests_sent ?? '—'), label: 'Requests sent' },
    { value: st?.rating != null ? Number(st.rating).toFixed(1) : '—', label: 'Rating' },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[t.pageTitle, { flex: 1 }]}>My Profile</Text>
        <Pressable style={styles.gear} onPress={() => router.push('/settings')} accessibilityLabel="Settings">
          <Settings size={s(20)} color={colors.ink} strokeWidth={2.1} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingBottom: s(24) }}>
        <ShadowBox radius={s(32)} color={colors.shadowSoft} offset={{ x: s(4), y: s(5) }} style={{ marginTop: s(16) }}>
          <View style={styles.card}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <Hatched radius={s(40)} dashed={colors.lime} iconSize={s(22)} style={styles.photo} />
            )}
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {p.full_name}
              </Text>
              {p.verification_status === 'verified' && (
                <View style={styles.badge}>
                  <Check size={s(12)} color={colors.ink} strokeWidth={3.2} />
                </View>
              )}
            </View>
            <Text style={styles.sub} numberOfLines={1}>
              {subtitle}
            </Text>
            {p.verification_status === 'pending' && <Text style={styles.pending}>Verification under review</Text>}
            <Pressable style={styles.edit} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editText}>Edit profile</Text>
            </Pressable>
          </View>
        </ShadowBox>

        <View style={styles.stats}>
          {stats.map((x) => (
            <View key={x.label} style={styles.stat}>
              <Text style={styles.statValue}>{x.value}</Text>
              <Text style={styles.statLabel}>{x.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[t.label, { marginTop: s(24), marginBottom: s(10) }]}>Categories</Text>
        <View style={styles.catChip}>
          <Text style={styles.catText}>{p.category ? categoryLabel(p.category) : 'Not set'}</Text>
        </View>

        <View style={{ marginTop: s(24) }}>
          <Row label="Verification & badges" onPress={() => router.push('/auth/verify-docs?mode=manage')} />
          <Divider />
          <Row label="Saved profiles" onPress={() => router.push('/saved')} />
          <Divider />
          <Row label="Help & support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <Text style={styles.rowText}>{label}</Text>
      <ChevronRight size={s(20)} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

const PHOTO = s(78);
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TAB_PAD, paddingTop: s(16) },
  gear: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { backgroundColor: colors.navy, borderRadius: s(32), alignItems: 'center', paddingVertical: s(22), paddingHorizontal: s(16) },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2, borderWidth: s(2), borderStyle: 'dashed', borderColor: colors.lime },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: s(14) },
  name: { fontFamily: fonts.display, fontSize: s(22), color: colors.white, flexShrink: 1 },
  badge: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
  },
  sub: { fontFamily: fonts.body, fontSize: s(16), color: colors.navyText, marginTop: s(2) },
  pending: { fontFamily: fonts.bodyMedium, fontSize: s(13), color: colors.lime, marginTop: s(4) },
  edit: {
    marginTop: s(16),
    backgroundColor: colors.lime,
    borderRadius: s(20),
    height: s(38),
    paddingHorizontal: s(24),
    justifyContent: 'center',
  },
  editText: { fontFamily: fonts.display, fontSize: s(16), color: colors.ink, marginTop: s(2) },
  stats: { flexDirection: 'row', gap: s(12), marginTop: s(20) },
  stat: {
    flex: 1,
    height: s(72),
    borderRadius: s(20),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontFamily: fonts.display, fontSize: s(21), color: colors.ink, lineHeight: s(26) },
  statLabel: { fontFamily: fonts.body, fontSize: s(14), color: colors.textMuted },
  catChip: {
    alignSelf: 'flex-start',
    height: s(40),
    borderRadius: s(20),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: s(18),
    justifyContent: 'center',
  },
  catText: { fontFamily: fonts.displayBold, fontSize: s(16.5), color: colors.teal, marginTop: s(2) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: s(16), paddingHorizontal: s(4) },
  rowText: { fontFamily: fonts.bodyBold, fontSize: s(18), color: colors.ink },
});
