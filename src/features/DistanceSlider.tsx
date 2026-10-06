import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import { colors, fonts, s } from '../theme/tokens';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

const THUMB = s(20);

/** Distance slider from the Filters sheet (blue fill, white thumb with blue ring). */
export function DistanceSlider({ value, min, max, step, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startX = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const toValue = (x: number) => {
    const w = widthRef.current || 1;
    const ratio = Math.min(Math.max(x / w, 0), 1);
    const raw = min + ratio * (max - min);
    return Math.min(max, Math.max(min, Math.round(raw / step) * step));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          startX.current = e.nativeEvent.locationX;
          onChangeRef.current(toValue(e.nativeEvent.locationX));
        },
        onPanResponderMove: (_, g) => onChangeRef.current(toValue(startX.current + g.dx)),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const x = ((value - min) / (max - min)) * width;
  const label = `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} km`;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Distance"
      accessibilityValue={{ text: label }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + step));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - step));
      }}
    >
      <View style={{ height: THUMB + s(12), justifyContent: 'center' }} onLayout={onLayout} {...pan.panHandlers}>
        <View pointerEvents="none" style={{ height: s(8), borderRadius: 999, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: x, backgroundColor: colors.blue, borderRadius: 999 }} />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: x - THUMB / 2,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: colors.white,
            borderWidth: s(3),
            borderColor: colors.blue,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: s(4) }}>
        <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted }}>0 km</Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(11.5), color: colors.ink }}>{label}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted }}>{max} km</Text>
      </View>
    </View>
  );
}
