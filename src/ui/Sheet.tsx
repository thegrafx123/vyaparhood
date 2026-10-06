import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeTo, SheetUp } from '../motion';
import { colors, s } from '../theme/tokens';

/**
 * Bottom sheet used by the Filters, Send request and City screens:
 * backdrop fades in, sheet slides up (vhSheetUp). Rendered by
 * transparent-modal routes, so the screen underneath stays visible.
 */
export function BottomSheet({
  children,
  onDismiss,
  scroll,
  maxHeight = '86%',
  style,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  scroll?: boolean;
  maxHeight?: `${number}%` | number;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const close = () => {
    Keyboard.dismiss();
    onDismiss();
  };
  const body = (
    <>
      <View
        style={{ alignSelf: 'center', width: s(42), height: s(5), borderRadius: s(3), backgroundColor: colors.handle, marginBottom: s(16) }}
      />
      {children}
    </>
  );
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FadeTo to={1} duration={300} style={StyleSheet.absoluteFill}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
      </FadeTo>
      <View style={{ flex: 1 }} pointerEvents="box-none" />
      <SheetUp style={{ maxHeight }}>
        <View
          style={[
            {
              backgroundColor: colors.bg,
              borderTopLeftRadius: s(28),
              borderTopRightRadius: s(28),
              borderWidth: s(3),
              borderBottomWidth: 0,
              borderColor: colors.ink,
              // A scrolling sheet pads its content instead, so the buttons'
              // hard shadows aren't clipped at the scroll edges.
              paddingHorizontal: scroll ? 0 : s(24),
              paddingTop: s(20),
              paddingBottom: scroll ? 0 : Math.max(insets.bottom + s(10), s(30)),
            },
            style,
          ]}
        >
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingHorizontal: s(24), paddingBottom: Math.max(insets.bottom + s(10), s(30)) }}
            >
              {body}
            </ScrollView>
          ) : (
            body
          )}
        </View>
      </SheetUp>
    </KeyboardAvoidingView>
  );
}
