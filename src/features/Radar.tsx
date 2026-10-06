import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { DistanceLike } from '../api/types';
import { Halo, PinPop, RingPulse } from '../motion';
import { formatDistance } from '../services/location';
import { colors, fonts, s } from '../theme/tokens';
import { MemberPhoto } from '../ui/Avatar';

type Props = {
  members: DistanceLike[];
  maxKm: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Where around the centre a pin sits. The angle is decorative on purpose:
 * only the distance from the centre means anything, so the radar never
 * reveals which direction a business is in. Pins are spread with the
 * golden angle (137.5°) so neighbours never land on top of each other.
 */
const GOLDEN = (137.508 * Math.PI) / 180;
const START = (-120 * Math.PI) / 180;
const angleFor = (index: number) => START + index * GOLDEN;

const PIN = s(44);
const PIN_SELECTED = s(54);

/**
 * 15b · Nearby radar: rings, a ring that keeps pulsing out from "you"
 * (vhRingPulse), a breathing halo (vhCenterPulse) and member pins that
 * pop in one after another (vhPinPop) with their distance.
 */
export function Radar({ members, maxKm, selectedId, onSelect }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const cx = size.w / 2;
  const cy = size.h * 0.46;
  const half = Math.min(size.w, size.h) / 2;
  const inner = s(46);
  const outer = Math.max(inner + s(20), half - s(30));

  return (
    <View
      onLayout={onLayout}
      style={{
        flex: 1,
        borderRadius: s(24),
        borderWidth: s(2.5),
        borderColor: colors.ink,
        overflow: 'hidden',
        backgroundColor: '#DCE9FF',
      }}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="radarBg" cx="50%" cy="42%" r="70%">
            <Stop offset="0%" stopColor="#EAF2FF" />
            <Stop offset="100%" stopColor="#DCE9FF" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#radarBg)" />
      </Svg>

      {size.w > 0 && (
        <>
          {[s(100), s(190), s(280)].map((d) => (
            <View
              key={d}
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: d,
                height: d,
                left: cx - d / 2,
                top: cy - d / 2,
                borderRadius: d / 2,
                borderWidth: s(1.5),
                borderColor: 'rgba(47,111,234,0.18)',
              }}
            />
          ))}
          <RingPulse style={{ position: 'absolute', left: cx - s(30), top: cy - s(30) }} pointerEvents="none">
            <View style={{ width: s(60), height: s(60), borderRadius: s(30), borderWidth: s(1.5), borderColor: 'rgba(47,111,234,0.35)' }} />
          </RingPulse>
          <Halo size={s(42)} grow={1.3} color={colors.blue} style={{ position: 'absolute', left: cx - s(21), top: cy - s(21) }} />
          <View
            accessibilityLabel="You"
            style={{
              position: 'absolute',
              left: cx - s(8),
              top: cy - s(8),
              width: s(16),
              height: s(16),
              borderRadius: s(8),
              backgroundColor: colors.blue,
              borderWidth: s(3),
              borderColor: colors.white,
            }}
          />

          {members.map((m, i) => {
            const selected = m.id === selectedId;
            const size_ = selected ? PIN_SELECTED : PIN;
            const a = angleFor(i);
            const d = m.distance_km ?? maxKm;
            const r = inner + Math.min(d / Math.max(maxKm, 0.5), 1) * (outer - inner);
            const x = Math.min(Math.max(cx + Math.cos(a) * r, size_ / 2 + s(8)), size.w - size_ / 2 - s(12));
            const y = Math.min(Math.max(cy + Math.sin(a) * r, size_ / 2 + s(28)), size.h - size_ / 2 - s(14));
            const label = formatDistance(d, m.distance_precise) ?? '';
            return (
              <PinPop
                key={m.id}
                from={0.4}
                dy={6}
                delay={150 + i * 100}
                style={{ position: 'absolute', left: x - size_ / 2 - s(12), top: y - size_ / 2 - s(24), width: size_ + s(24), alignItems: 'center' }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${m.full_name}, ${label} away`}
                  onPress={() => onSelect(m.id)}
                  hitSlop={6}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    style={{
                      backgroundColor: selected ? colors.green : colors.ink,
                      borderRadius: 999,
                      paddingHorizontal: s(7),
                      paddingVertical: s(2),
                      marginBottom: s(4),
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(9.5), color: selected ? colors.ink : colors.white }}>{label}</Text>
                  </View>
                  <View style={{ borderRadius: s(16), boxShadow: `${s(4)}px ${s(5)}px 0px ${colors.ink}` }}>
                    <MemberPhoto
                      path={m.photo_path}
                      size={size_}
                      radius={s(16)}
                      borderColor={selected ? colors.green : colors.ink}
                      borderWidth={selected ? s(3) : s(2.5)}
                    />
                  </View>
                </Pressable>
              </PinPop>
            );
          })}
        </>
      )}
    </View>
  );
}
