import { StatusBar } from 'expo-status-bar';
import React, { useId } from 'react';
import { KeyboardAvoidingView, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { colors, H_PAD, s } from '../theme/tokens';

/** `.vh-tex` — the faint dot grid behind onboarding and form screens. */
export function DotTexture() {
  const id = `tex${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={s(15)} height={s(15)}>
          <Circle cx={s(7.5)} cy={s(7.5)} r={s(1.6)} fill="rgba(22,35,63,0.06)" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Organic blob that bleeds off a screen corner (onboarding, paywall). */
export function Blob({
  color,
  size,
  opacity = 1,
  rotate = '0deg',
  style,
}: {
  color: string;
  size: number;
  opacity?: number;
  rotate?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          opacity,
          borderTopLeftRadius: size * 0.46,
          borderTopRightRadius: size * 0.54,
          borderBottomRightRadius: size * 0.6,
          borderBottomLeftRadius: size * 0.4,
          transform: [{ rotate }],
        },
        style,
      ]}
    />
  );
}

/** Full-screen page with safe-area padding and the design's background. */
export function Screen({
  children,
  bg = colors.bg,
  texture,
  statusBar = 'dark',
  padTop = true,
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  texture?: boolean;
  statusBar?: 'dark' | 'light';
  padTop?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: bg, paddingTop: padTop ? insets.top : 0, overflow: 'hidden' }, style]}>
      <StatusBar style={statusBar} />
      {texture && <DotTexture />}
      {children}
    </View>
  );
}

/** Keyboard-aware wrapper for form screens. */
export function KeyboardArea({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, style]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
}

/** Bottom area holding the main button, clear of the home indicator. */
export function Footer({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        { paddingHorizontal: H_PAD, paddingTop: s(16), paddingBottom: Math.max(insets.bottom + s(8), s(30)) },
        style,
      ]}
    >
      {children}
    </View>
  );
}
