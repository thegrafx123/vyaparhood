import React, { useState } from 'react';
import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from 'react-native';

/**
 * `object-fit: cover` with an `object-position` focus point, which RN's
 * Image doesn't support: the photo fills the box and the focus point
 * (0–1 on each axis) decides which part stays visible.
 */
export function CoverImage({
  source,
  aspect,
  focusX = 0.5,
  focusY = 0.5,
  label,
  style,
}: {
  source: ImageSourcePropType;
  /** Image height / width. */
  aspect: number;
  focusX?: number;
  focusY?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const scaleW = box.w;
  const scaleH = box.w * aspect;
  const fitByHeight = scaleH < box.h;
  const w = fitByHeight ? box.h / aspect : scaleW;
  const h = fitByHeight ? box.h : scaleH;
  return (
    <View
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {box.w > 0 && (
        <Image
          source={source}
          accessibilityLabel={label}
          style={{ position: 'absolute', width: w, height: h, left: (box.w - w) * focusX, top: (box.h - h) * focusY }}
        />
      )}
    </View>
  );
}
