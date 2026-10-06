import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { FadeUp, PressScale } from '../motion';
import { colors, fonts, s } from '../theme/tokens';
import { ChevronLeft } from './icons';

/** Round "back" button (40 pt, white, ink outline). */
export function BackButton({
  onPress,
  size = s(40),
  bg = colors.white,
  style,
}: {
  onPress?: () => void;
  size?: number;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/discover')))}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: s(2.5),
          borderColor: colors.ink,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <ChevronLeft size={size * 0.4} color={colors.ink} />
    </PressScale>
  );
}

/** The blue "VH" square. */
export function LogoMark({
  size = s(30),
  border = s(2.5),
  borderColor = colors.ink,
}: {
  size?: number;
  border?: number;
  borderColor?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.33,
        backgroundColor: colors.blue,
        borderWidth: border,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{ fontFamily: fonts.display, fontSize: size * 0.4, lineHeight: size * 0.56, color: colors.lime, marginTop: size * 0.05 }}
      >
        VH
      </Text>
    </View>
  );
}

export function Brand({ size = s(30), textSize = s(15) }: { size?: number; textSize?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(9) }}>
      <LogoMark size={size} border={size > s(28) ? s(2.5) : s(2)} />
      <Text style={{ fontFamily: fonts.display, fontSize: textSize, color: colors.ink, marginTop: s(2) }}>Vyaparhood</Text>
    </View>
  );
}

/** Onboarding header: logo + name, optional Skip on the right. */
export function BrandRow({ onSkip, style }: { onSkip?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <FadeUp
      delay={20}
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(24), paddingTop: s(22) },
        style,
      ]}
    >
      <Brand />
      {onSkip && (
        <Pressable onPress={onSkip} hitSlop={12} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(13), color: colors.text }}>Skip</Text>
        </Pressable>
      )}
    </FadeUp>
  );
}

/** Back button + title, as on "Set up your profile", "Settings" … */
export function HeaderRow({
  title,
  titleSize = s(18),
  right,
  onBack,
  pad = s(24),
  style,
}: {
  title?: string;
  titleSize?: number;
  right?: React.ReactNode;
  onBack?: () => void;
  pad?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <FadeUp
      delay={20}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: s(14), paddingHorizontal: pad, paddingTop: s(22) }, style]}
    >
      <BackButton onPress={onBack} />
      {title ? (
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{ flex: 1, fontFamily: fonts.display, fontSize: titleSize, color: colors.ink, marginTop: s(2) }}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </FadeUp>
  );
}
