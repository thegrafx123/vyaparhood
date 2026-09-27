import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberCardData } from '../api/types';
import { formatDistance } from '../services/location';
import { colors, fonts, s } from '../theme/tokens';
import { Tag } from './Controls';
import { MemberAvatar } from './MemberAvatar';
import { ArrowRight } from './icons';
import { SoftCard } from './Layout';

export function MemberCard({ member, onPress }: { member: MemberCardData; onPress: () => void }) {
  return (
    <SoftCard radius={s(26)} style={{ marginBottom: s(16) }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${member.full_name}, ${member.headline}`}
        style={({ pressed }) => [styles.inner, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.top}>
          <MemberAvatar path={member.photo_path} size={s(54)} radius={s(15)} verified={member.verified} />
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={1}>
              {member.full_name}
            </Text>
            <Text style={styles.role} numberOfLines={1}>
              {member.headline}
            </Text>
            <Text style={styles.loc} numberOfLines={1}>
              {[member.area, member.distance_km != null ? formatDistance(member.distance_km, member.distance_precise) : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
        <View style={styles.bottom}>
          {member.tag_label ? <Tag label={member.tag_label} tone={member.tag_tone ?? 'blue'} /> : <View />}
          <View style={styles.link}>
            <Text style={styles.linkText}>View profile</Text>
            <ArrowRight size={s(15)} color={colors.blue} strokeWidth={2.5} />
          </View>
        </View>
      </Pressable>
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  inner: { paddingHorizontal: s(16), paddingTop: s(16), paddingBottom: s(14) },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  texts: { flex: 1, marginLeft: s(14), marginTop: -s(2) },
  name: { fontFamily: fonts.display, fontSize: s(18.5), color: colors.ink },
  role: { fontFamily: fonts.body, fontSize: s(15.5), color: '#4A5670', marginTop: -s(1) },
  loc: { fontFamily: fonts.body, fontSize: s(13.5), color: colors.textMuted, marginTop: s(2) },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s(12) },
  link: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  linkText: { fontFamily: fonts.display, fontSize: s(15.5), color: colors.blue, marginTop: s(2) },
});
