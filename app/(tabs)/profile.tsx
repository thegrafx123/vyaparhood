import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useStats } from '../../src/api/hooks';
import { categoryLabel, SUPPORT_EMAIL } from '../../src/config';
import { FadeUp, PressScale } from '../../src/motion';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, s, shadow, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { MemberPhoto, VerifiedTick } from '../../src/ui/Avatar';
import { Row, StatTile } from '../../src/ui/Cards';
import { Tag } from '../../src/ui/Form';
import { Gear } from '../../src/ui/icons';
import { Screen } from '../../src/ui/Screen';

/** 25 · My profile. */
export default function MyProfile() {
  const router = useRouter();
  const { me } = useAuth();
  const { data: stats } = useStats();
  const p = me?.profile;
  if (!p) return null;

  const verified = p.verification_status === 'verified';

  return (
    <Screen>
      <FadeUp delay={20} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: TAB_PAD, paddingTop: s(22) }}>
        <Text style={t.pageTitle} accessibilityRole="header">
          My Profile
        </Text>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
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
          <Gear size={s(18)} color={colors.ink} />
        </PressScale>
      </FadeUp>

      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(30) }}>
        <FadeUp delay={100}>
          <View style={{ backgroundColor: colors.ink, borderRadius: s(22), padding: s(20), alignItems: 'center', boxShadow: shadow.deep }}>
            <MemberPhoto path={p.photo_path} size={s(76)} radius={s(38)} dashed={colors.lime} borderColor={p.photo_path ? colors.lime : undefined} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: s(12) }}>
              <Text style={{ fontFamily: fonts.display, fontSize: s(18), color: colors.white }}>{p.full_name || 'Your name'}</Text>
              {verified && <VerifiedTick size={s(16)} bg={colors.lime} fg={colors.ink} />}
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: s(12.5), color: colors.navyText, marginTop: s(2), textAlign: 'center' }}>
              {[p.headline, p.city].filter(Boolean).join(' · ')}
            </Text>
            <PressScale
              accessibilityRole="button"
              onPress={() => router.push('/edit-profile')}
              style={{
                marginTop: s(14),
                backgroundColor: colors.lime,
                borderWidth: s(2),
                borderColor: colors.ink,
                borderRadius: 999,
                paddingVertical: s(8),
                paddingHorizontal: s(20),
              }}
            >
              <Text style={{ fontFamily: fonts.displayBold, fontSize: s(12.5), color: colors.ink }}>Edit profile</Text>
            </PressScale>
          </View>
        </FadeUp>

        <View style={{ flexDirection: 'row', gap: s(10), marginTop: s(16) }}>
          <StatTile delay={180} value={String(stats?.connections ?? 0)} label="Connections" />
          <StatTile delay={230} value={String(stats?.requests_sent ?? 0)} label="Requests sent" />
          <StatTile delay={280} value={stats?.rating ? String(stats.rating) : '—'} label="Rating" />
        </View>

        {p.category ? (
          <FadeUp delay={340} style={{ marginTop: s(20) }}>
            <Text style={[t.label, { marginBottom: s(8) }]}>Categories</Text>
            <Tag label={categoryLabel(p.category)} tone="teal" outlined />
          </FadeUp>
        ) : null}

        <View style={{ marginTop: s(22) }}>
          <FadeUp delay={400} style={{ borderBottomWidth: s(2), borderBottomColor: colors.line }}>
            <Row
              label="Verification & badges"
              chevron
              padV={s(14)}
              onPress={() =>
                Alert.alert(
                  verified ? 'Phone verified ✓' : 'Not verified yet',
                  verified
                    ? 'Your phone number was verified by OTP when you joined, so your profile shows the green tick.'
                    : 'Sign in with your phone number to get verified.',
                )
              }
            />
          </FadeUp>
          <FadeUp delay={450} style={{ borderBottomWidth: s(2), borderBottomColor: colors.line }}>
            <Row label="Saved profiles" chevron padV={s(14)} onPress={() => router.push('/saved')} />
          </FadeUp>
          <FadeUp delay={500} style={p.is_admin ? { borderBottomWidth: s(2), borderBottomColor: colors.line } : undefined}>
            <Row label="Help & support" chevron padV={s(14)} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
          </FadeUp>
          {p.is_admin && (
            <FadeUp delay={550}>
              <Row label="Admin tools" chevron padV={s(14)} onPress={() => router.push('/admin')} />
            </FadeUp>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
