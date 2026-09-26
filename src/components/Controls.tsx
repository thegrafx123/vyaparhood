import React, { forwardRef } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { TagTone } from '../data/sample';
import { BORDER, colors, fonts, s } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { Check } from './icons';
import { ShadowBox } from './ShadowBox';

/* ---------------- Chip ---------------- */

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'lg' | 'md';
  /** Dark navy fill when selected (the "All" chip on Discover). */
  selectedTone?: 'blue' | 'navy';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected, onPress, size = 'md', selectedTone = 'blue', icon, style }: ChipProps) {
  const lg = size === 'lg';
  const h = lg ? s(46) : s(36);
  const fill = selected ? (selectedTone === 'navy' ? colors.ink : colors.blue) : colors.white;
  const body = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h,
          borderRadius: h / 2,
          paddingHorizontal: lg ? s(20) : s(15),
          borderWidth: BORDER,
          borderColor: colors.ink,
          backgroundColor: fill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? <View style={{ marginRight: s(6) }}>{icon}</View> : null}
      <Text
        style={{
          fontFamily: lg ? fonts.display : fonts.bodyBold,
          fontSize: lg ? s(17) : s(15),
          marginTop: lg ? s(2) : 0,
          color: selected ? colors.white : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  if (lg && selected) {
    return (
      <ShadowBox radius={h / 2} offset={{ x: s(3), y: s(4) }} style={style}>
        {body}
      </ShadowBox>
    );
  }
  return <View style={style}>{body}</View>;
}

/* ---------------- Tag ---------------- */

const TAG_TONES: Record<TagTone, { bg: string; fg: string }> = {
  orange: { bg: colors.orangeSoft, fg: colors.orange },
  yellow: { bg: colors.yellowSoft, fg: colors.yellow },
  blue: { bg: colors.blueSoft, fg: colors.blueTag },
  teal: { bg: colors.tealSoft, fg: colors.teal },
};

export function Tag({
  label,
  tone,
  outlined,
  style,
}: {
  label: string;
  tone: TagTone;
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = TAG_TONES[tone];
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: c.bg },
        outlined && { borderWidth: BORDER, borderColor: colors.ink, height: s(36), borderRadius: s(18) },
        style,
      ]}
    >
      <Text style={[styles.tagText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/* ---------------- TextField ---------------- */

type FieldProps = TextInputProps & {
  label?: string;
  optionalHint?: string;
  helper?: string;
  error?: string | null;
  left?: React.ReactNode;
  right?: React.ReactNode;
  shadow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  height?: number;
};

export const TextField = forwardRef<TextInput, FieldProps>(function TextField(
  { label, optionalHint, helper, error, left, right, shadow, containerStyle, height, multiline, style, ...input },
  ref,
) {
  const h = height ?? (multiline ? s(96) : s(50));
  const box = (
    <View
      style={[
        styles.field,
        { height: h, borderRadius: multiline ? s(22) : h / 2 },
        multiline && { alignItems: 'flex-start', paddingTop: s(12) },
        error ? { borderColor: colors.error } : null,
      ]}
    >
      {left ? <View style={{ marginRight: s(10) }}>{left}</View> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && { height: '100%' }, style]}
        {...input}
      />
      {right}
    </View>
  );
  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[t.label, { marginBottom: s(8) }]}>
          {label}
          {optionalHint ? <Text style={styles.optional}> {optionalHint}</Text> : null}
        </Text>
      ) : null}
      {shadow ? <ShadowBox radius={multiline ? s(22) : h / 2}>{box}</ShadowBox> : box}
      {error ? (
        <Text style={[t.error, { marginTop: s(6) }]}>{error}</Text>
      ) : helper ? (
        <Text style={[t.helper, { marginTop: s(6) }]}>{helper}</Text>
      ) : null}
    </View>
  );
});

/* ---------------- Checkbox ---------------- */

export function Checkbox({ checked, size = s(26) }: { checked: boolean; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: s(7),
        borderWidth: BORDER,
        borderColor: colors.ink,
        backgroundColor: checked ? colors.green : colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && <Check size={size * 0.62} color={colors.white} strokeWidth={3.4} />}
    </View>
  );
}

/* ---------------- Toggle ---------------- */

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  const w = s(46);
  const h = s(28);
  const knob = s(20);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        borderWidth: BORDER,
        borderColor: colors.ink,
        backgroundColor: value ? colors.lime : colors.blueSoft,
        justifyContent: 'center',
        paddingHorizontal: s(2.5),
      }}
    >
      <View
        style={{
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          backgroundColor: value ? colors.ink : colors.white,
          alignSelf: value ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

/* ---------------- Radio ---------------- */

export function Radio({ selected }: { selected: boolean }) {
  const size = s(24);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: selected ? BORDER : s(2),
        borderColor: selected ? colors.ink : '#C9D4EA',
        backgroundColor: selected ? colors.blue : colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected && <View style={{ width: s(9), height: s(9), borderRadius: s(5), backgroundColor: colors.white }} />}
    </View>
  );
}

/* ---------------- Segmented ---------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segment, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Dots ---------------- */

export function Dots({ count, active, align = 'center' }: { count: number; active: number; align?: 'left' | 'center' }) {
  return (
    <View style={[styles.dots, { justifyContent: align === 'center' ? 'center' : 'flex-start' }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={i === active ? styles.dotActive : styles.dot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    height: s(28),
    borderRadius: s(14),
    paddingHorizontal: s(13),
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: s(14) },
  field: {
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(18),
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: s(16.5),
    color: colors.ink,
    paddingVertical: 0,
  },
  optional: { fontFamily: fonts.bodyMedium, color: '#BAC3D6' },
  segment: {
    height: s(52),
    borderRadius: s(26),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.blueSoft,
    flexDirection: 'row',
    padding: s(5),
  },
  segmentItem: { flex: 1, borderRadius: s(21), alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.blue },
  segmentText: { fontFamily: fonts.display, fontSize: s(16.5), color: '#5C6B8A', marginTop: s(2) },
  dots: { flexDirection: 'row', alignItems: 'center', gap: s(7) },
  dot: { width: s(7), height: s(7), borderRadius: s(4), backgroundColor: colors.dot },
  dotActive: { width: s(22), height: s(7), borderRadius: s(4), backgroundColor: colors.blue },
});
