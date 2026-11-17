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
  // Width of the bare word (drives the underline) and of the word plus
  // its trailing room (so we can take that room back from the gap).
  const [wordW, setWordW] = useState(0);
  const [fullW, setFullW] = useState(0);
  const squiggle = part.squiggle === undefined ? 'lime' : part.squiggle;
  // Caveat's slanted strokes and descenders draw outside the box the text
  // is measured at, and Android clips them (the "d" of sorted, "y" of
  // city, "s" of DMs, "g" of networking). Padding the view doesn't help on
  // Android, so:
  //  - append real non-breaking spaces, which the text engine counts as
  //    width, so the last letter's tail has room inside the text box;
  //  - use a taller line so descenders aren't cut at the bottom, and pull
  //    the same amount back with negative margins so the layout stays put.
  const TAIL = '  ';
  const tight = accentSize * 1.08;
  const roomy = accentSize * 1.4;
  const vPad = (roomy - tight) / 2;
  const tailW = wordW > 0 && fullW > wordW ? fullW - wordW : 0;
  const textStyle: TextStyle = { fontFamily: fonts.script, fontSize: accentSize, color: colors.blue };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: Math.max(0, space - tailW) }}>
      <View style={{ marginVertical: -vPad }}>
        {/* Invisible copy of the bare word, only to measure its width. */}
        <Text
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          onLayout={(e) => setWordW(e.nativeEvent.layout.width)}
          style={[base, textStyle, { lineHeight: roomy, position: 'absolute', opacity: 0 }]}
          numberOfLines={1}
        >
          {part.accent}
        </Text>
        <Text
          onLayout={(e) => setFullW(e.nativeEvent.layout.width)}
          style={[base, textStyle, { lineHeight: roomy }]}
        >
          {part.accent + TAIL}
        </Text>
        {squiggle && wordW > 0 && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, bottom: vPad - s(4) }}>
            <Squiggle
              width={wordW}
              color={squiggle === 'lime' ? colors.lime : colors.ink}
              animate={part.animate ?? true}
              delay={part.drawDelay ?? 550}
            />
          </View>
        )}
      </View>
      {part.suffix ? <Text style={[base, { marginLeft: -tailW }]}>{part.suffix}</Text> : null}
    </View>
  );
}
