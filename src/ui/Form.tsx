import React, { forwardRef, useEffect, useState } from 'react';
import { Pressable, StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pop, PressScale, Settle } from '../motion';
import { colors, fonts, s, shadow } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { Check, Close, Plus } from './icons';

/* ---------------- Labels ---------------- */

export function Label({ children, optional, style }: { children: string; optional?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginBottom: s(6) }, style]}>
      <Text style={t.label}>
        {children}
        {optional ? <Text style={{ fontFamily: fonts.bodyMedium, color: colors.placeholder }}> {optional}</Text> : null}
      </Text>
    </View>
  );
}

export function Helper({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return <Text style={[error ? t.error : t.helper, { marginTop: s(5) }]}>{children}</Text>;
}

/* ---------------- Field ---------------- */

type FieldProps = TextInputProps & {
  label?: string;
  optional?: string;
  helper?: string;
  error?: string | null;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** 4px 5px hard shadow, as on the phone number field. */
  raised?: boolean;
  boxStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  height?: number;
};

/** `.vh-field` — white box, ink outline, 16 pt corners. */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, optional, helper, error, left, right, raised, boxStyle, containerStyle, height, multiline, style, onFocus, onBlur, ...input },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      {label ? <Label optional={optional}>{label}</Label> : null}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: s(8),
            backgroundColor: colors.white,
            borderWidth: s(2.5),
            borderColor: error ? colors.error : focused ? colors.blue : colors.ink,
            borderRadius: s(16),
            paddingHorizontal: s(16),
            paddingVertical: multiline ? s(10) : 0,
            minHeight: height ?? (multiline ? s(64) : s(48)),
          },
          raised && { boxShadow: shadow.card },
          boxStyle,
        ]}
      >
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              fontFamily: fonts.bodyMedium,
              fontSize: s(14),
              color: colors.ink,
              paddingVertical: multiline ? 0 : s(12),
              minHeight: multiline ? (height ?? s(64)) - s(20) : undefined,
            },
            style,
          ]}
          {...input}
        />
        {right}
      </View>
      {error ? <Helper error>{error}</Helper> : helper ? <Helper>{helper}</Helper> : null}
    </View>
  );
});

/* ---------------- Chips ---------------- */

type ChipSize = 'sm' | 'md' | 'lg';

/**
 * Selectable pill. sm = profile/category chips, md = filters/discover,
 * lg = city chips (Baloo, raised when selected).
 */
export function Chip({
  label,
  selected,
  onPress,
  size = 'sm',
  selectedColor = colors.blue,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: ChipSize;
  selectedColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pad = size === 'lg' ? [s(11), s(18)] : size === 'md' ? [s(8), s(15)] : [s(8), s(14)];
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        {
          paddingVertical: pad[0],
          paddingHorizontal: pad[1],
          borderRadius: 999,
          borderWidth: s(2),
          borderColor: colors.ink,
          backgroundColor: selected ? selectedColor : colors.white,
        },
        size === 'lg' && selected && { boxShadow: shadow.chip },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: size === 'lg' ? fonts.displayBold : fonts.bodyBold,
          fontSize: size === 'lg' ? s(13.5) : size === 'md' ? s(12.5) : s(11.5),
          color: selected ? colors.white : colors.ink,
          marginTop: size === 'lg' ? s(1) : 0,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

/* ---------------- Tags ---------------- */

export type TagTone = 'teal' | 'blue' | 'orange' | 'yellow';

export const TAG_TONES: Record<TagTone, { bg: string; fg: string }> = {
  teal: { bg: colors.tealSoft, fg: colors.teal },
  blue: { bg: colors.blueSoft2, fg: colors.blue },
  orange: { bg: colors.orangeSoft, fg: colors.orange },
  yellow: { bg: colors.yellowSoft, fg: colors.yellow },
};

/** Soft coloured label ("Hiring baristas", "Co-founder"). */
export function Tag({
  label,
  tone,
  size = 'md',
  outlined,
  onRemove,
  style,
}: {
  label: string;
  tone: TagTone;
  size?: 'sm' | 'md';
  outlined?: boolean;
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = TAG_TONES[tone];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(6),
          alignSelf: 'flex-start',
          backgroundColor: c.bg,
          borderRadius: 999,
          paddingVertical: size === 'sm' ? s(4) : s(7),
          paddingHorizontal: size === 'sm' ? s(11) : s(13),
        },
        outlined && { borderWidth: s(2), borderColor: colors.ink },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: size === 'sm' ? s(11) : s(11.5), color: c.fg }}>{label}</Text>
      {onRemove && (
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${label}`} hitSlop={8} onPress={onRemove}>
          <Close size={s(11)} color={c.fg} sw={2.6} />
        </Pressable>
      )}
    </View>
  );
}

/** "I offer" / "I'm looking for" editor: type, press + (or return) to add. */
export function TagInput({
  values,
  onChange,
  tone,
  max = 5,
  placeholder = 'Add tag',
}: {
  values: string[];
  onChange: (v: string[]) => void;
  tone: TagTone;
  max?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!v || values.length >= max || values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <View style={{ gap: s(8) }}>
      {values.length < max && (
        <Field
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          returnKeyType="done"
          onSubmitEditing={add}
          submitBehavior="submit"
          style={{ fontSize: s(13) }}
          height={s(44)}
          right={
            draft.trim() ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Add" hitSlop={8} onPress={add}>
                <Plus size={s(16)} color={colors.blue} />
              </Pressable>
            ) : null
          }
        />
      )}
      {values.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(6) }}>
          {values.map((v) => (
            <Tag key={v} label={v} tone={tone} onRemove={() => onChange(values.filter((x) => x !== v))} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ---------------- Toggle ---------------- */

/** 40 × 24 switch: lime + ink knob when on. Settles in (vhToggleSettle). */
export function Toggle({
  value,
  onChange,
  label,
  settleDelay,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  settleDelay?: number;
}) {
  const w = s(40);
  const knob = s(18);
  const travel = w - s(4) - s(2) - knob;
  const x = useSharedValue(value ? travel : 0);
  useEffect(() => {
    x.value = withTiming(value ? travel : 0, { duration: 180 });
  }, [value, travel, x]);
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const body = (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={10}
      onPress={() => onChange(!value)}
      style={{
        width: w,
        height: s(24),
        borderRadius: 999,
        borderWidth: s(2),
        borderColor: colors.ink,
        backgroundColor: value ? colors.lime : colors.line,
        justifyContent: 'center',
        paddingHorizontal: s(1),
      }}
    >
      <Animated.View
        style={[
          { width: knob, height: knob, borderRadius: knob / 2, backgroundColor: value ? colors.ink : colors.white },
          knobStyle,
        ]}
      />
    </Pressable>
  );
  return settleDelay !== undefined ? <Settle delay={settleDelay}>{body}</Settle> : body;
}

/* ---------------- Checkbox / Radio ---------------- */

/** Green tick box. Pops in when checked (vhPop). */
export function Checkbox({ checked, size = s(22) }: { checked: boolean; size?: number }) {
  const box = (bg: string) => ({
    width: size,
    height: size,
    borderRadius: s(7),
    borderWidth: s(2),
    borderColor: colors.ink,
    backgroundColor: bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });
  if (!checked) return <View style={box(colors.white)} />;
  return (
    <Pop from={0.4} peak={1.12}>
      <View style={box(colors.green)}>
        <Check size={size * 0.55} color={colors.white} sw={3.4} />
      </View>
    </Pop>
  );
}

export function Radio({ selected }: { selected: boolean }) {
  const size = s(20);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: s(2),
        borderColor: selected ? colors.ink : colors.dot,
        backgroundColor: selected ? colors.blue : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected && <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: colors.white }} />}
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
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.blueSoft,
          borderRadius: 999,
          padding: s(4),
          borderWidth: s(2),
          borderColor: colors.ink,
        },
        style,
      ]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: s(8),
              borderRadius: 999,
              backgroundColor: active ? colors.blue : 'transparent',
            }}
          >
            <Text style={{ fontFamily: fonts.displayBold, fontSize: s(13), color: active ? colors.white : colors.text, marginTop: s(1) }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Page dots ---------------- */

export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: s(6) }} accessibilityLabel={`Step ${active + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? s(22) : s(7),
            height: s(7),
            borderRadius: s(4),
            backgroundColor: i === active ? colors.blue : colors.dot,
          }}
        />
      ))}
    </View>
  );
}
