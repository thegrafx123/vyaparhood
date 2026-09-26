import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BORDER, colors, fonts, s } from '../theme/tokens';
import { ArrowRight, Check, Send } from './icons';
import { ShadowBox } from './ShadowBox';

type CircleIcon = 'arrow' | 'send' | 'check';

const BTN_H = s(62);
const CIRCLE = s(46);

function CircleGlyph({ icon, size, loading }: { icon: CircleIcon; size: number; loading?: boolean }) {
  if (loading) return <ActivityIndicator color={colors.ink} size="small" />;
  const props = { size, color: colors.ink, strokeWidth: 2.4 };
  if (icon === 'send') return <Send {...props} />;
  if (icon === 'check') return <Check {...props} />;
  return <ArrowRight {...props} />;
}

type PrimaryProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Where the lime circle sits. 'none' renders a plain centred button. */
  circle?: 'right' | 'left' | 'none';
  icon?: CircleIcon;
  style?: StyleProp<ViewStyle>;
};

/**
 * The big blue call-to-action from every screen ("Next", "Send OTP" …).
 * Pressing it slides the button onto its shadow, like pressing a sticker.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  circle = 'right',
  icon = 'arrow',
  style,
}: PrimaryProps) {
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  return (
    <ShadowBox radius={BTN_H / 2} hidden={pressed} style={[{ opacity: disabled ? 0.45 : 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!inactive }}
        onPress={onPress}
        disabled={inactive}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.primary,
          circle === 'left' && { justifyContent: 'center' },
          circle === 'none' && { justifyContent: 'center', paddingLeft: 0 },
          pressed && { transform: [{ translateX: s(3) }, { translateY: s(4) }] },
        ]}
      >
        <Text style={[styles.primaryLabel, circle === 'left' && { marginLeft: s(8) }]} numberOfLines={1}>
          {label}
        </Text>
        {circle !== 'none' && (
          <View style={[styles.circle, circle === 'left' ? { left: s(7) } : { right: s(7) }]}>
            <CircleGlyph icon={icon} size={s(20)} loading={loading} />
          </View>
        )}
      </Pressable>
    </ShadowBox>
  );
}

/** White pill with ink outline ("View profile", "Decline"). */
export function OutlineButton({
  label,
  onPress,
  style,
  height = s(46),
  textColor = colors.ink,
  borderColor = colors.ink,
  fill = colors.white,
  borderWidth = BORDER,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
  textColor?: string;
  borderColor?: string;
  fill?: string;
  borderWidth?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.outline,
        { height, borderRadius: height / 2, borderColor, backgroundColor: fill, borderWidth },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.outlineLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

/** Smaller blue button with a lime circle ("Connect"). */
export function CompactCta({
  label,
  onPress,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const h = s(46);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.compact,
        { height: h, borderRadius: h / 2, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={styles.compactLabel}>{label}</Text>
      <View style={styles.compactCircle}>
        <ArrowRight size={s(15)} color={colors.ink} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: BTN_H,
    borderRadius: BTN_H / 2,
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: s(26),
  },
  primaryLabel: {
    fontFamily: fonts.display,
    fontSize: s(21),
    lineHeight: s(28),
    color: colors.white,
    marginTop: s(2),
  },
  circle: {
    position: 'absolute',
    top: (BTN_H - BORDER * 2 - CIRCLE) / 2,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.lime,
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(16),
  },
  outlineLabel: { fontFamily: fonts.display, fontSize: s(16.5), marginTop: s(2) },
  compact: {
    backgroundColor: colors.blue,
    borderWidth: BORDER,
    borderColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: s(22),
  },
  compactLabel: { fontFamily: fonts.display, fontSize: s(16.5), color: colors.white, marginTop: s(2) },
  compactCircle: {
    position: 'absolute',
    right: s(5),
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: colors.lime,
    borderWidth: BORDER,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
