import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { FadeUp } from '../motion';
import { colors, fonts, s, shadow } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { ChevronRight } from './icons';

/** White card with ink outline and soft hard shadow (member cards, requests). */
export function Card({
  children,
  radius = s(20),
  pad = s(14),
  elevated = 'soft',
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  pad?: number;
  elevated?: 'soft' | 'softer' | 'hard' | 'none';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderWidth: s(2.5),
          borderColor: colors.ink,
          borderRadius: radius,
          padding: pad,
        },
        elevated === 'soft' && { boxShadow: shadow.soft },
        elevated === 'softer' && { boxShadow: shadow.softer },
        elevated === 'hard' && { boxShadow: shadow.cta },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Uppercase grey label above a settings group ("ACCOUNT"). */
export function SectionLabel({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <FadeUp delay={delay} style={{ marginTop: s(20), marginHorizontal: s(4), marginBottom: s(4) }}>
      <Text style={t.sectionLabel}>{children}</Text>
    </FadeUp>
  );
}

/** Rounded white group holding settings rows. */
export function Group({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <FadeUp delay={delay}>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: s(2.5),
          borderColor: colors.ink,
          borderRadius: s(18),
          paddingHorizontal: s(16),
          paddingVertical: s(4),
          boxShadow: shadow.softer,
        }}
      >
        {items.map((child, i) => (
          <View key={i} style={i < items.length - 1 ? { borderBottomWidth: s(2), borderBottomColor: colors.line } : null}>
            {child}
          </View>
        ))}
      </View>
    </FadeUp>
  );
}

/** One settings / menu row: label on the left, value or chevron on the right. */
export function Row({
  label,
  value,
  valueColor = colors.muted,
  valueBold,
  right,
  onPress,
  chevron = !!onPress && !value && !right,
  labelColor = colors.ink,
  padV = s(15),
}: {
  label: string;
  value?: string;
  valueColor?: string;
  valueBold?: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  labelColor?: string;
  padV?: number;
}) {
  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: s(12),
        paddingVertical: padV,
        paddingHorizontal: s(4),
        opacity: pressed ? 0.6 : 1,
      }}
    >
      <Text style={[t.row, { color: labelColor, flexShrink: 1 }]}>{label}</Text>
      {value ? (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: valueBold ? fonts.bodyBold : fonts.body,
            fontSize: s(12.5),
            color: valueColor,
            flexShrink: 1,
            textAlign: 'right',
          }}
        >
          {value}
        </Text>
      ) : null}
      {right}
      {chevron && <ChevronRight size={s(14)} color={colors.muted} />}
    </View>
  );
  if (!onPress) return content(false);
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

/** Small white tile with a number (My Profile stats). */
export function StatTile({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <FadeUp delay={delay} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: s(2),
          borderColor: colors.ink,
          borderRadius: s(16),
          padding: s(12),
          alignItems: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize: s(17), color: colors.ink }}>{value}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: s(10.5), color: colors.muted }}>{label}</Text>
      </View>
    </FadeUp>
  );
}

export function Loading({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(40) }, style]}>
      <ActivityIndicator color={colors.blue} />
    </View>
  );
}

/** Friendly empty / error state. */
export function Empty({
  title,
  body,
  action,
  style,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <FadeUp delay={80} style={[{ alignItems: 'center', paddingHorizontal: s(30), paddingVertical: s(40), gap: s(8) }, style]}>
      <Text style={{ fontFamily: fonts.display, fontSize: s(18), color: colors.ink, textAlign: 'center' }}>{title}</Text>
      {body ? <Text style={[t.body, { textAlign: 'center' }]}>{body}</Text> : null}
      {action ? <View style={{ marginTop: s(10), alignSelf: 'stretch' }}>{action}</View> : null}
    </FadeUp>
  );
}
