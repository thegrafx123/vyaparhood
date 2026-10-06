import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Breathe, PressScale, usePressed } from '../motion';
import { colors, fonts, s, shadow } from '../theme/tokens';
import { ArrowRight, Check, Send } from './icons';

type CircleIcon = 'arrow' | 'send' | 'check';

function Glyph({ icon, size }: { icon: CircleIcon; size: number }) {
  if (icon === 'send') return <Send size={size} color={colors.ink} />;
  if (icon === 'check') return <Check size={size} color={colors.ink} sw={3} />;
  return <ArrowRight size={size} color={colors.ink} />;
}

/**
 * `.vh-cta` — the big blue pill with the lime circle. It breathes
 * (vhCtaBreathe) and, when pressed, slides onto its shadow
 * (`translate(2px, 3px)` + smaller shadow), exactly like the design.
 */
export function CtaButton({
  label,
  onPress,
  disabled,
  loading,
  circle = 'right',
  icon = 'arrow',
  size = 'lg',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Where the lime circle sits. 'none' = centred label only. */
  circle?: 'right' | 'left' | 'none';
  icon?: CircleIcon;
  /** lg: 42 pt circle, 16 pt label. md: 40 pt circle, 15 pt label. */
  size?: 'lg' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const press = usePressed();
  const inactive = !!disabled || !!loading;
  const c = size === 'lg' ? s(42) : s(40);
  const fontSize = size === 'lg' ? s(16) : s(15);

  const pill = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      {...press.handlers}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: circle === 'none' ? 'center' : 'space-between',
            backgroundColor: colors.blue,
            borderWidth: s(3),
            borderColor: colors.ink,
            borderRadius: 999,
            padding: s(6),
            paddingLeft: circle === 'right' ? s(26) : s(6),
            minHeight: c + s(12) + s(6),
            boxShadow: press.pressed ? shadow.ctaPressed : shadow.cta,
          },
          press.style,
        ]}
      >
        {circle === 'left' && <Circle size={c} icon={icon} loading={loading} />}
        <Text
          numberOfLines={1}
          style={{
            flex: circle === 'left' ? 1 : undefined,
            textAlign: circle === 'left' ? 'center' : undefined,
            paddingRight: circle === 'left' ? c : 0,
            fontFamily: fonts.displayBold,
            fontSize,
            color: colors.white,
            marginTop: s(2),
          }}
        >
          {label}
        </Text>
        {circle === 'right' && <Circle size={c} icon={icon} loading={loading} />}
        {circle === 'none' && loading && <ActivityIndicator color={colors.white} style={{ marginLeft: s(10) }} />}
      </Animated.View>
    </Pressable>
  );

  if (inactive) return <View style={[{ opacity: disabled && !loading ? 0.5 : 1 }, style]}>{pill}</View>;
  return <Breathe style={style}>{pill}</Breathe>;
}

function Circle({ size, icon, loading }: { size: number; icon: CircleIcon; loading?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.lime,
        borderWidth: s(2.5),
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading ? <ActivityIndicator color={colors.ink} size="small" /> : <Glyph icon={icon} size={size * 0.38} />}
    </View>
  );
}

/** Smaller blue pill with a lime circle ("Connect" on the radar card). */
export function SmallCta({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.blue,
          borderWidth: s(2),
          borderColor: colors.ink,
          borderRadius: 999,
          padding: s(4),
          paddingLeft: s(16),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.displayBold, fontSize: s(12.5), color: colors.white, marginTop: s(1) }}>{label}</Text>
      <View
        style={{
          width: s(28),
          height: s(28),
          borderRadius: s(14),
          backgroundColor: colors.lime,
          borderWidth: s(2),
          borderColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ArrowRight size={s(12)} color={colors.ink} />
      </View>
    </PressScale>
  );
}

/**
 * Pill buttons: 'outline' (View profile, Decline), 'lime' (Accept),
 * 'danger' (Block this member), 'lime-small' (Edit profile).
 */
export function PillButton({
  label,
  onPress,
  tone = 'outline',
  size = 'sm',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'outline' | 'lime' | 'danger';
  size?: 'sm' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const lg = size === 'lg';
  const fg = tone === 'danger' ? colors.orange : colors.ink;
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: s(8),
          borderRadius: 999,
          borderWidth: tone === 'danger' ? s(2.5) : s(2),
          borderColor: tone === 'danger' ? colors.orange : colors.ink,
          backgroundColor: tone === 'lime' ? colors.lime : colors.white,
          paddingVertical: lg ? s(12) : s(8),
          paddingHorizontal: s(16),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={fg} size="small" />}
      <Text style={{ fontFamily: fonts.displayBold, fontSize: lg ? s(15) : s(12.5), color: fg, marginTop: s(1) }}>{label}</Text>
    </PressScale>
  );
}

/** Plain text action ("Reset", "Log out", "Edit"). */
export function TextButton({
  label,
  onPress,
  color = colors.blue,
  size = s(13),
  display,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  display?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={style}>
      {({ pressed }) => (
        <Text
          style={{
            fontFamily: display ? fonts.displayBold : fonts.bodyBold,
            fontSize: size,
            color,
            opacity: pressed ? 0.6 : 1,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
