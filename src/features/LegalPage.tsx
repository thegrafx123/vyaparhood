import React from 'react';
import { ScrollView, Text } from 'react-native';
import { FadeUp } from '../motion';
import { colors, fonts, s } from '../theme/tokens';
import { HeaderRow } from '../ui/Header';
import { Screen } from '../ui/Screen';

export type LegalSection = { title: string; body: string };

/**
 * Screens 29–31. Plain-language copy that matches how the app works —
 * have a lawyer review it before launch.
 */
export function LegalPage({ title, sections, updated }: { title: string; sections: LegalSection[]; updated: string }) {
  return (
    <Screen>
      <HeaderRow title={title} titleSize={s(19)} pad={s(20)} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: s(26), paddingTop: s(18), paddingBottom: s(40) }}>
        {sections.map((sec, i) => (
          <FadeUp key={sec.title} delay={80 + Math.min(i, 8) * 60} style={{ marginBottom: s(20) }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.displayBold, fontSize: s(13.5), color: colors.ink, marginBottom: s(6) }}>
              {sec.title}
            </Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: s(12.5), lineHeight: s(20), color: colors.text }}>{sec.body}</Text>
          </FadeUp>
        ))}
        <FadeUp delay={80 + Math.min(sections.length, 8) * 60}>
          <Text style={{ fontFamily: fonts.body, fontSize: s(11), color: colors.placeholder, marginTop: s(8) }}>Last updated {updated}</Text>
        </FadeUp>
      </ScrollView>
    </Screen>
  );
}
