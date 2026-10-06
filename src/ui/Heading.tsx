import React, { useState } from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Squiggle } from '../motion';
import { colors, fonts, s } from '../theme/tokens';

export type HeadingPart =
  | string
  | {
      /** Word(s) set in the handwritten face, e.g. "city". */
      accent: string;
      /** Underline colour, or false for none. Default lime. */
      squiggle?: 'lime' | 'ink' | false;
      /** Draw the underline in (vhDraw). Some design screens leave it static. */
      animate?: boolean;
      /** Delay before drawing, ms (design: 450–550). */
      drawDelay?: number;
      /** Glued to the accent without a space, e.g. "?". */
      suffix?: string;
    };

/**
 * Headings like "Find the right people in your *city*": Baloo 800 with
 * one Caveat accent in blue and a hand-drawn underline that draws
 * itself. Words wrap naturally on narrow phones.
 */
export function AccentHeading({
  parts,
  size = 28,
  accentSize,
  lineHeight = 1.12,
  color = colors.ink,
  style,
}: {
  parts: HeadingPart[];
  /** Design points (scaled inside). */
  size?: number;
  accentSize?: number;
  lineHeight?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const fs = s(size);
  const as = s(accentSize ?? size * 1.2);
  const base: TextStyle = { fontFamily: fonts.display, fontSize: fs, lineHeight: fs * lineHeight + s(2), color };
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, i) => {
    if (typeof part === 'string') {
      part
        .split(' ')
        .filter(Boolean)
        .forEach((word, j) => {
          nodes.push(
            <Text key={`${i}-${j}`} style={base}>
              {word + ' '}
            </Text>,
          );
        });
      return;
    }
    nodes.push(<Accent key={`${i}-a`} part={part} base={base} accentSize={as} space={fs * 0.26} />);
  });

  return (
    <View
      accessibilityRole="header"
      accessible
      accessibilityLabel={parts.map((p) => (typeof p === 'string' ? p : p.accent + (p.suffix ?? ''))).join(' ')}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' }, style]}
    >
      {nodes}
    </View>
  );
}

function Accent({
  part,
  base,
  accentSize,
  space,
}: {
  part: Exclude<HeadingPart, string>;
  base: TextStyle;
  accentSize: number;
  space: number;
}) {
  const [width, setWidth] = useState(0);
  const squiggle = part.squiggle === undefined ? 'lime' : part.squiggle;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: space }}>
      <View>
        <Text
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={[base, { fontFamily: fonts.script, fontSize: accentSize, lineHeight: accentSize * 1.08, color: colors.blue }]}
        >
          {part.accent}
        </Text>
        {squiggle && width > 0 && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, bottom: -s(4) }}>
            <Squiggle
              width={width}
              color={squiggle === 'lime' ? colors.lime : colors.ink}
              animate={part.animate ?? true}
              delay={part.drawDelay ?? 550}
            />
          </View>
        )}
      </View>
      {part.suffix ? <Text style={base}>{part.suffix}</Text> : null}
    </View>
  );
}
