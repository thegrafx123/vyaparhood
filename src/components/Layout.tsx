import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER, colors, fonts, H_PAD, s, SOFT_SHADOW } from '../theme/tokens';
import { type as t } from '../theme/typography';
import { ChevronLeft } from './icons';
import { ShadowBox } from './ShadowBox';

/* ---------- Screen ---------- */

export function Screen({
  children,
  bg = colors.bg,
  style,
  statusBar = 'dark',
  padTop = true,
}: {
  children: React.ReactNode;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  statusBar?: 'dark' | 'light';
  padTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: bg, paddingTop: padTop ? insets.top : 0 }, style]}>
      <StatusBar style={statusBar} />
      {children}
    </View>
  );
}

/** Keyboard-aware wrapper for form screens. */
export function KeyboardArea({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
}

/* ---------- Back button ---------- */

export function BackButton({ onPress, bg = 'transparent' }: { onPress?: () => void; bg?: string }) {
  const router = useRouter();
  const size = s(42);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/discover')))}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: BORDER,
        borderColor: colors.ink,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <ChevronLeft size={s(21)} color={colors.ink} strokeWidth={2.4} />
    </Pressable>
  );
}

/* ---------- Brand ---------- */

export function LogoMark({ size = s(34), faded }: { size?: number; faded?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: colors.blue,
        borderWidth: faded ? 0 : BORDER,
        borderColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.4, color: colors.lime, marginTop: size * 0.06 }}>
        VH
      </Text>
    </View>
  );
}

export function BrandHeader({
  onSkip,
  back,
  style,
}: {
  onSkip?: () => void;
  back?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.brandRow, style]}>
      {back && <BackButton />}
      <View style={[styles.brand, back && { marginLeft: s(14) }]}>
        <LogoMark size={back ? s(32) : s(34)} />
        <Text style={styles.brandText}>Vyaparhood</Text>
      </View>
      <View style={{ flex: 1 }} />
      {onSkip && (
        <Pressable onPress={onSkip} hitSlop={10} accessibilityRole="button">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Back button + title, as on "Set up your profile", "Settings" … */
export function HeaderRow({ title, right, style }: { title?: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.headerRow, style]}>
      <BackButton />
      {title ? <Text style={[t.headerTitle, { marginLeft: s(16), flex: 1 }]}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

/* ---------- Footer ---------- */

/** Bottom area that holds the main CTA, respecting the home indicator. */
export function Footer({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        { paddingHorizontal: H_PAD, paddingTop: s(12), paddingBottom: Math.max(insets.bottom, s(14)) + s(10) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---------- Cards ---------- */

export function SoftCard({
  children,
  radius = s(26),
  style,
  innerStyle,
  shadowColor = colors.shadowSoft,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  shadowColor?: string;
}) {
  return (
    <ShadowBox radius={radius} color={shadowColor} offset={SOFT_SHADOW} style={style}>
      <View
        style={[
          { borderRadius: radius, borderWidth: BORDER, borderColor: colors.ink, backgroundColor: colors.white },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </ShadowBox>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: s(1.5), backgroundColor: colors.divider }, style]} />;
}

/** Decorative circle bleeding off the screen edge. */
export function Blob({ color, size, top, left, right }: { color: string; size: number; top: number; left?: number; right?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        top,
        left,
        right,
      }}
    />
  );
}

/* ---------- Bottom sheet (used by transparent-modal routes) ---------- */

export function BottomSheet({
  children,
  onDismiss,
  style,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [slide]);

  const close = () => {
    Keyboard.dismiss();
    Animated.timing(slide, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => onDismiss());
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }]} onPress={close} accessibilityLabel="Close" />
      <View style={{ flex: 1 }} pointerEvents="box-none" />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, s(14)) + s(8) },
          { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, 700] }) }] },
          style,
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD, paddingTop: s(14) },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { fontFamily: fonts.display, fontSize: s(18), color: colors.ink, marginLeft: s(11), marginTop: s(3) },
  skip: { fontFamily: fonts.displayBold, fontSize: s(17), color: '#6A7A99', marginTop: s(2) },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PAD, paddingTop: s(14) },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: s(32),
    borderTopRightRadius: s(32),
    borderWidth: BORDER,
    borderBottomWidth: 0,
    borderColor: colors.ink,
    paddingHorizontal: H_PAD,
    paddingTop: s(12),
  },
  handle: {
    alignSelf: 'center',
    width: s(40),
    height: s(5),
    borderRadius: s(3),
    backgroundColor: '#D6DDEB',
    marginBottom: s(22),
  },
});
