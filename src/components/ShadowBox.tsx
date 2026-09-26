import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, HARD_SHADOW } from '../theme/tokens';

type Props = {
  radius: number;
  color?: string;
  offset?: { x: number; y: number };
  /** Hide the shadow (e.g. while pressed) without changing layout. */
  hidden?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * Draws a solid, un-blurred copy of the child's shape behind it, shifted
 * down-right. This renders identically on iOS and Android, unlike native
 * shadows/elevation.
 *
 * The child must fill the wrapper exactly (no margins on the child —
 * put margins on `style`).
 */
export function ShadowBox({
  radius,
  color = colors.ink,
  offset = HARD_SHADOW,
  hidden,
  style,
  children,
}: Props) {
  return (
    <View style={style}>
      {!hidden && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: color,
              borderRadius: radius,
              transform: [{ translateX: offset.x }, { translateY: offset.y }],
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}
