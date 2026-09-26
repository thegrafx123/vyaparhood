import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Member } from '../data/sample';
import { formatDistance } from '../services/location';
import { colors, fonts, s } from '../theme/tokens';
import { Tag } from './Controls';
import { Avatar } from './Hatched';
import { ArrowRight } from './icons';
import { SoftCard } from './Layout';

export function MemberCard({ member, onPress }: { member: Member; onPress: () => void }) {
  return (
    <SoftCard radius={s(26)} style={{ marginBottom: s(16) }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${member.name}, ${member.role}`}
        style={({ pressed }) => [styles.inner, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.top}>
          <Avatar size={s(54)} radius={s(15)} verified={member.verified} />
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
            </Text>
            <Text style={styles.role} numberOfLines={1}>
              {member.role}
            </Text>
            <Text style={styles.loc} numberOfLines={1}>
              {member.area} · {formatDistance(member.distanceKm, member.sharesExactDistance)}
            </Text>
          </View>
        </View>
        <View style={styles.bottom}>
          {member.tag ? <Tag label={member.tag.label} tone={member.tag.tone} /> : <View />}
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
