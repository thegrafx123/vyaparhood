import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, s } from '../theme/tokens';
import { type as t } from '../theme/typography';

export type HeadingPart =
  | string
  | {
      accent: string;
      /** Wavy underline colour, or false for none. */
      squiggle?: 'lime' | 'ink' | false;
      /** Text glued to the accent with no space, e.g. "?" */
      suffix?: string;
    };

type Props = {
  parts: HeadingPart[];
  size?: number;
  lineHeight?: number;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/** Hand-drawn wave used under accent words. */
export function Squiggle({ color, width, height }: { color: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 12" preserveAspectRatio="none">
      <Path
        d="M2 7 C 10 1, 18 1, 26 7 S 42 13, 50 7 S 66 1, 74 7 S 90 13, 98 6"
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Renders headings like "Find the right people in your *city*" where the
 * accent word is set in the handwritten face with a squiggle underneath.
 * Words wrap naturally on narrow screens.
 */
export function Heading({
  parts,
  size = s(30),
  lineHeight = s(37),
  align = 'left',
  style,
  textStyle,
}: Props) {
  const base: TextStyle = { ...StyleSheet.flatten(t.h1), fontSize: size, lineHeight };
  const accentSize = size * 1.14;
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    if (typeof part === 'string') {
      part
        .split(' ')
        .filter(Boolean)
        .forEach((word, j) => {
          nodes.push(
            <Text key={`${i}-${j}`} style={[base, textStyle]}>
              {word + ' '}
            </Text>,
          );
        });
      return;
    }
    const squiggle = part.squiggle === undefined ? 'lime' : part.squiggle;
    nodes.push(
      <View key={`${i}-accent`} style={styles.accentWrap}>
        <Text
          style={[
            base,
            {
              fontFamily: fonts.script,
              fontSize: accentSize,
              lineHeight,
              color: colors.blue,
            },
          ]}
        >
          {part.accent}
          {part.suffix ? (
            <Text style={[base, textStyle, { fontFamily: fonts.display }]}>{part.suffix}</Text>
          ) : null}
          {' '}
        </Text>
        {squiggle && (
          <View style={styles.squiggle} pointerEvents="none">
            <Squiggle
              color={squiggle === 'lime' ? colors.lime : colors.ink}
              width={Math.max(s(40), part.accent.length * accentSize * 0.3)}
              height={s(9)}
            />
          </View>
        )}
      </View>,
    );
  });

  return (
    <View
      accessibilityRole="header"
      style={[
        styles.row,
        { justifyContent: align === 'center' ? 'center' : 'flex-start' },
        style,
      ]}
    >
      {nodes}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  accentWrap: { position: 'relative' },
  squiggle: { position: 'absolute', left: -s(2), bottom: -s(3) },
});
