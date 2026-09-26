import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Member } from '../data/sample';
import { formatDistance } from '../services/location';
import { BORDER, colors, fonts, s } from '../theme/tokens';
import { Hatched } from './Hatched';
import { ShadowBox } from './ShadowBox';

type Props = {
  members: Member[];
  maxKm: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const AVATAR = s(46);

/**
 * Stable pseudo-random angle per member. The angle is decorative on
 * purpose: only the ring (distance) means anything, so the radar can
 * never reveal which direction someone is in.
 */
function angleFor(m: Member) {
  if (typeof m.radarAngleDeg === 'number') return (m.radarAngleDeg * Math.PI) / 180;
  let h = 0;
  for (let i = 0; i < m.id.length; i++) h = (h * 31 + m.id.charCodeAt(i)) >>> 0;
  return ((h % 360) * Math.PI) / 180;
}

export function Radar({ members, maxKm, selectedId, onSelect }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const cx = size.w / 2;
  const cy = size.h / 2;
  const half = Math.min(size.w, size.h) / 2;
  const rings = [0.28, 0.52, 0.76, 1.0].map((f) => f * half * 0.95);

  const inner = rings[0] + s(6);
  const outer = Math.min(half - AVATAR * 0.55, size.h / 2 - AVATAR * 0.8);

  return (
    <View style={styles.card} onLayout={onLayout}>
      {size.w > 0 && (
        <>
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            {rings.map((r, i) => (
              <Circle key={i} cx={cx} cy={cy} r={r} stroke={colors.radarRing} strokeWidth={1.2} fill="none" />
            ))}
            <Circle cx={cx} cy={cy} r={s(30)} fill={colors.radarHalo} stroke={colors.radarRing} strokeWidth={1.2} />
            <Circle cx={cx} cy={cy} r={s(17)} fill="#C3D5FA" />
            <Circle cx={cx} cy={cy} r={s(10)} fill={colors.blue} stroke={colors.white} strokeWidth={s(3)} />
          </Svg>

          {members.map((m) => {
            const a = angleFor(m);
            const r = inner + Math.min(m.distanceKm / Math.max(maxKm, 0.5), 1) * (outer - inner);
            const x = Math.min(Math.max(cx + Math.cos(a) * r, AVATAR / 2 + s(6)), size.w - AVATAR / 2 - s(10));
            const y = Math.min(Math.max(cy + Math.sin(a) * r, AVATAR / 2 + s(30)), size.h - AVATAR / 2 - s(12));
            const selected = m.id === selectedId;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`${m.name}, ${formatDistance(m.distanceKm, m.sharesExactDistance)} away`}
                onPress={() => onSelect(m.id)}
                hitSlop={6}
                style={[styles.pin, { left: x - AVATAR / 2, top: y - AVATAR / 2 - s(26) }]}
              >
                <View style={[styles.label, selected && { backgroundColor: colors.green }]}>
                  <Text style={[styles.labelText, selected && { color: colors.ink }]}>
                    {formatDistance(m.distanceKm, m.sharesExactDistance)}
                  </Text>
                </View>
                <ShadowBox radius={s(14)} offset={{ x: s(4), y: s(5) }}>
                  <Hatched
                    radius={s(14)}
                    dashed={selected ? colors.green : colors.ink}
                    iconSize={s(16)}
                    style={[
                      { width: AVATAR, height: AVATAR },
                      selected && { borderWidth: s(2.5) },
                    ]}
                  />
                </ShadowBox>
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: s(28),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.radar,
    overflow: 'hidden',
  },
  pin: { position: 'absolute', alignItems: 'center', width: AVATAR + s(20), marginLeft: -s(10) },
  label: {
    backgroundColor: colors.ink,
    borderRadius: s(12),
    paddingHorizontal: s(9),
    height: s(22),
    justifyContent: 'center',
    marginBottom: s(4),
  },
  labelText: { fontFamily: fonts.displayBold, fontSize: s(12.5), color: colors.white, marginTop: s(1) },
});
