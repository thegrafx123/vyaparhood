import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, s } from '../theme/tokens';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

const THUMB = s(30);

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

  const valueRef = useRef(value);
  valueRef.current = value;

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
        onPanResponderMove: (_, g) => {
          onChangeRef.current(toValue(startX.current + g.dx));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const ratio = (value - min) / (max - min);
  const x = ratio * width;
  const label = `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} km`;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Distance"
      accessibilityValue={{ text: label }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + step));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - step));
      }}
    >
      <View style={styles.touch} onLayout={onLayout} {...pan.panHandlers}>
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: x }]} />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: x - THUMB / 2 }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.edge}>0 km</Text>
        <Text
          style={[styles.value, { position: 'absolute', left: Math.min(Math.max(x - s(28), s(40)), width - s(96)) }]}
        >
          {label}
        </Text>
        <Text style={styles.edge}>{max} km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touch: { height: THUMB + s(8), justifyContent: 'center' },
  track: { height: s(8), borderRadius: s(4), backgroundColor: colors.blueSoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blue },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: s(3.5),
    borderColor: colors.blue,
    backgroundColor: colors.white,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: s(6) },
  edge: { fontFamily: fonts.body, fontSize: s(14), color: colors.textMuted },
  value: { fontFamily: fonts.bodyBold, fontSize: s(15), color: colors.ink, width: s(56), textAlign: 'center' },
});
