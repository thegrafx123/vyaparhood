import React, { useId } from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { BORDER, colors, fonts, s } from '../theme/tokens';
import { Check, ImageGlyph } from './icons';

type HatchedProps = {
  radius?: number;
  dashed?: string | false;
  label?: string;
  iconSize?: number;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** The striped "photo goes here" placeholder used across the designs. */
export function Hatched({
  radius = s(14),
  dashed = colors.blue,
  label,
  iconSize = s(22),
  showIcon = true,
  style,
  children,
}: HatchedProps) {
  const id = `hatch${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: colors.hatch,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dashed ? { borderWidth: BORDER, borderStyle: 'dashed', borderColor: dashed } : null,
        style,
      ]}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern
            id={id}
            patternUnits="userSpaceOnUse"
            width={s(16)}
            height={s(16)}
            patternTransform="rotate(-45)"
          >
            <Rect x={0} y={0} width={s(8)} height={s(16)} fill={colors.hatchStripe} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {showIcon && <ImageGlyph size={iconSize} color={colors.hatchIcon} strokeWidth={1.8} />}
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
    </View>
  );
}

type AvatarProps = {
  size: number;
  radius?: number;
  source?: ImageSourcePropType | null;
  uri?: string | null;
  dashed?: string | false;
  verified?: boolean;
  online?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Square avatar; falls back to the hatched placeholder when no photo exists. */
export function Avatar({
  size,
  radius = size * 0.28,
  source,
  uri,
  dashed = colors.blue,
  verified,
  online,
  style,
}: AvatarProps) {
  const img = uri ? { uri } : source;
  return (
    <View style={[{ width: size, height: size }, style]}>
      {img ? (
        <Image source={img} style={{ width: size, height: size, borderRadius: radius }} />
      ) : (
        <Hatched
          radius={radius}
          dashed={dashed}
          iconSize={size * 0.36}
          style={{ width: size, height: size }}
        />
      )}
      {verified && (
        <View
          style={[
            styles.verified,
            { width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18 },
          ]}
        >
          <Check size={size * 0.2} color={colors.white} strokeWidth={3.2} />
        </View>
      )}
      {online && (
        <View
          style={[styles.online, { width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12 }]}
        />
      )}
    </View>
  );
}

export function VerifiedBadge({ size = s(20) }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.green,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={size * 0.58} color={colors.white} strokeWidth={3.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: s(8),
    fontFamily: fonts.displayBold,
    fontSize: s(15),
    letterSpacing: s(0.8),
    color: colors.hatchText,
  },
  verified: {
    position: 'absolute',
    right: -s(4),
    bottom: -s(4),
    backgroundColor: colors.green,
    borderWidth: s(2),
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  online: {
    position: 'absolute',
    right: -s(2),
    bottom: -s(2),
    backgroundColor: colors.online,
    borderWidth: s(2),
    borderColor: colors.white,
  },
});
