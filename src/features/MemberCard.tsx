import React from 'react';
import { Text, View } from 'react-native';
import { MemberCardData } from '../api/types';
import { FadeUp, PressScale } from '../motion';
import { formatDistance } from '../services/location';
import { colors, fonts, s, shadow } from '../theme/tokens';
import { MemberPhoto } from '../ui/Avatar';
import { Tag } from '../ui/Form';
import { ArrowRight } from '../ui/icons';
import { memberTag } from './memberTag';

/** Discover (Citywide) card: photo, name, headline, area · distance, tag, "View profile". */
export function MemberCard({ member, delay, onPress }: { member: MemberCardData; delay: number; onPress: () => void }) {
  const tag = memberTag(member);
  const distance = formatDistance(member.distance_km, member.distance_precise);
  const where = [member.area, distance].filter(Boolean).join(' · ');
  return (
    <FadeUp delay={delay} duration={500}>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={`${member.full_name}, ${member.headline}${distance ? `, ${distance} away` : ''}`}
        onPress={onPress}
        scaleTo={0.98}
        style={{
          backgroundColor: colors.white,
          borderWidth: s(2.5),
          borderColor: colors.ink,
          borderRadius: s(20),
          padding: s(14),
          gap: s(11),
          boxShadow: shadow.soft,
        }}
      >
        <View style={{ flexDirection: 'row', gap: s(12), alignItems: 'center' }}>
          <MemberPhoto path={member.photo_path} size={s(54)} radius={s(16)} verified={member.verified} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.displayBold, fontSize: s(15.5), color: colors.ink }}>
              {member.full_name}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: s(12.5), color: colors.text, marginTop: s(1) }}>
              {member.headline}
            </Text>
            {where ? (
              <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted, marginTop: s(2) }}>
                {where}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) }}>
          {tag ? <Tag label={tag.label} tone={tag.tone} size="sm" style={{ flexShrink: 1 }} /> : <View />}
          {/* The whole card opens the profile; this is its visible label. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(4) }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: s(12.5), color: colors.blue }}>View profile</Text>
            <ArrowRight size={s(11)} color={colors.blue} sw={2.4} />
          </View>
        </View>
      </PressScale>
    </FadeUp>
  );
}
