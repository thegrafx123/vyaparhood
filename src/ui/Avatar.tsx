import React, { useId } from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useSignedUrl } from '../api/hooks';
import { colors, s } from '../theme/tokens';
import { Check, ImageGlyph } from './icons';

/** `.vh-ph` — striped photo placeholder with a dashed blue outline. */
export function Placeholder({
  radius = s(14),
  dashed = colors.blue,
  borderWidth = s(2),
  iconSize,
  iconColor = colors.blue,
  style,
  children,
}: {
  radius?: number;
  dashed?: string | false;
  borderWidth?: number;
  iconSize?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const id = `ph${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: colors.blueSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dashed ? { borderWidth, borderStyle: 'dashed', borderColor: dashed } : null,
        style,
      ]}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={s(16)} height={s(16)} patternTransform="rotate(45)">
            <Rect x={0} y={0} width={s(8)} height={s(16)} fill={colors.line} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {iconSize ? (
        <View style={{ opacity: 0.55 }}>
          <ImageGlyph size={iconSize} color={iconColor} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Green circle with a white tick (verified). */
export function VerifiedTick({
  size = s(18),
  ring,
  bg = colors.green,
  fg = colors.white,
  style,
}: {
  size?: number;
  ring?: string;
  bg?: string;
  fg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityLabel="Verified"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ring ? { borderWidth: s(2), borderColor: ring, width: size + s(4), height: size + s(4), borderRadius: (size + s(4)) / 2 } : null,
        style,
      ]}
    >
      <Check size={size * 0.5} color={fg} sw={3.4} />
    </View>
  );
}

type AvatarProps = {
  size: number;
  radius?: number;
  uri?: string | null;
  source?: ImageSourcePropType | null;
  dashed?: string | false;
  verified?: boolean;
  online?: boolean;
  onlineRing?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Square-ish photo; the striped placeholder when there is no photo. */
export function Avatar({
  size,
  radius = size * 0.3,
  uri,
  source,
  dashed = colors.blue,
  verified,
  online,
  onlineRing = colors.white,
  borderColor,
  borderWidth = s(2.5),
  style,
}: AvatarProps) {
  const img = uri ? { uri } : source;
  return (
    <View style={[{ width: size, height: size }, style]}>
      {img ? (
        <Image
          source={img}
          accessibilityIgnoresInvertColors
          style={[
            { width: size, height: size, borderRadius: radius, backgroundColor: colors.blueSoft },
            borderColor ? { borderWidth, borderColor } : null,
          ]}
        />
      ) : (
        <Placeholder
          radius={radius}
          dashed={borderColor ?? dashed}
          borderWidth={borderColor ? borderWidth : s(2)}
          iconSize={size * 0.34}
          style={{ width: size, height: size }}
        />
      )}
      {verified && (
        <VerifiedTick size={s(18)} ring={colors.white} style={{ position: 'absolute', right: -s(4), bottom: -s(4) }} />
      )}
      {online && (
        <View
          style={{
            position: 'absolute',
            right: -s(1),
            bottom: -s(1),
            width: s(11),
            height: s(11),
            borderRadius: s(6),
            backgroundColor: colors.green,
            borderWidth: s(2),
            borderColor: onlineRing,
          }}
        />
      )}
    </View>
  );
}

/** Avatar for a member's private photo (loaded through a short-lived link). */
export function MemberPhoto({ path, ...rest }: Omit<AvatarProps, 'uri' | 'source'> & { path: string | null | undefined }) {
  const url = useSignedUrl(path);
  return <Avatar uri={url ?? null} {...rest} />;
}
