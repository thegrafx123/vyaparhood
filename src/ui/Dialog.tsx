import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FadeTo, SheetIn } from '../motion';
import { colors, s, shadow } from '../theme/tokens';

export type DialogButton = {
  label: string;
  onPress: () => void;
  bold?: boolean;
  /** Blue text (the "yes" options); otherwise ink. */
  primary?: boolean;
};

/**
 * The permission-style card from slides 1 and 13: rounded translucent
 * card, icon, title, message and system-looking buttons, scaling in over
 * a dimmed backdrop (vhSheetIn).
 *
 * `layout="stack"` puts buttons one under another (location);
 * `layout="row"` puts two side by side (notifications).
 */
export function SystemDialog({
  icon,
  title,
  message,
  buttons,
  layout = 'stack',
  width = s(280),
  dim = colors.dim,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  buttons: DialogButton[];
  layout?: 'stack' | 'row';
  width?: number;
  dim?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <FadeTo to={1} duration={250} style={[StyleSheet.absoluteFill, { backgroundColor: dim }]} />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <SheetIn>
          <View
            accessibilityViewIsModal
            style={{
              width,
              backgroundColor: colors.alertBg,
              borderRadius: s(14),
              overflow: 'hidden',
              boxShadow: shadow.alert,
            }}
          >
            <View style={{ paddingTop: s(22), paddingHorizontal: s(20), paddingBottom: s(16), alignItems: 'center' }}>
              {icon ? <View style={{ marginBottom: s(10) }}>{icon}</View> : null}
              <Text
                accessibilityRole="header"
                style={{
                  fontWeight: '600',
                  fontSize: s(14.5),
                  lineHeight: s(19.5),
                  color: colors.ink,
                  textAlign: 'center',
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontSize: s(12),
                  lineHeight: s(17.4),
                  color: colors.alertText,
                  marginTop: s(8),
                  textAlign: 'center',
                }}
              >
                {message}
              </Text>
              {children}
            </View>
            <View
              style={{
                flexDirection: layout === 'row' ? 'row' : 'column',
                borderTopWidth: StyleSheet.hairlineWidth * 2,
                borderTopColor: colors.alertLine,
              }}
            >
              {buttons.map((b, i) => (
                <Pressable
                  key={b.label}
                  accessibilityRole="button"
                  onPress={b.onPress}
                  style={({ pressed }) => [
                    {
                      flex: layout === 'row' ? 1 : undefined,
                      paddingVertical: s(12),
                      alignItems: 'center',
                      backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent',
                    },
                    i < buttons.length - 1 &&
                      (layout === 'row'
                        ? { borderRightWidth: StyleSheet.hairlineWidth * 2, borderRightColor: colors.alertLine }
                        : { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: colors.alertLine }),
                  ]}
                >
                  <Text
                    style={{
                      fontSize: s(14.5),
                      fontWeight: b.bold ? '700' : '400',
                      color: b.primary ? colors.blue : colors.ink,
                    }}
                  >
                    {b.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </SheetIn>
      </View>
    </View>
  );
}

/**
 * Apple asks that screens shown before the real permission popup don't
 * imitate it with "Allow" buttons, so on iPhone the design keeps its look
 * but the buttons read "Continue" / "Not now". Android keeps the design's
 * wording.
 */
export const isIOS = Platform.OS === 'ios';
