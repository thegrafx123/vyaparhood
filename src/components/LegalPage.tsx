import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, s, TAB_PAD } from '../theme/tokens';
import { HeaderRow, Screen } from './Layout';

export type LegalSection = { title: string; body: string };

/**
 * Screens 31–33. The copy is the design's placeholder text plus a few
 * required additions — have a lawyer review before launch.
 */
export function LegalPage({ title, sections, updated }: { title: string; sections: LegalSection[]; updated: string }) {
  return (
    <Screen>
      <HeaderRow title={title} style={{ paddingHorizontal: TAB_PAD }} />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((sec) => (
          <React.Fragment key={sec.title}>
            <Text style={styles.h}>{sec.title}</Text>
            <Text style={styles.p}>{sec.body}</Text>
          </React.Fragment>
        ))}
        <Text style={styles.updated}>Last updated {updated}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: s(26), paddingTop: s(20), paddingBottom: s(40) },
  h: { fontFamily: fonts.display, fontSize: s(16.5), color: colors.ink, marginTop: s(20) },
  p: { fontFamily: fonts.body, fontSize: s(16), lineHeight: s(25), color: colors.text, marginTop: s(4) },
  updated: { fontFamily: fonts.body, fontSize: s(13.5), color: '#BAC3D6', marginTop: s(24) },
});
