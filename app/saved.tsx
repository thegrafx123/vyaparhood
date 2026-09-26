import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../src/components/Hatched';
import { Bookmark } from '../src/components/icons';
import { HeaderRow, Screen, SoftCard } from '../src/components/Layout';
import { getMember, useApp } from '../src/state/AppStore';
import { colors, fonts, s, TAB_PAD } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

/** 29 · Saved profiles. */
export default function Saved() {
  const router = useRouter();
  const { state, actions } = useApp();
  const members = state.savedIds.map((id) => getMember(state, id)).filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <Screen>
      <HeaderRow title="Saved profiles" style={{ paddingHorizontal: TAB_PAD }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(22), paddingBottom: s(30) }}>
        {members.map((m) => (
          <SoftCard key={m.id} radius={s(24)} style={{ marginBottom: s(14) }}>
            <Pressable style={styles.row} onPress={() => router.push(`/member/${m.id}`)}>
              <Avatar size={s(50)} radius={s(14)} />
              <View style={{ flex: 1, marginLeft: s(14) }}>
                <Text style={t.name}>{m.name}</Text>
                <Text style={styles.role} numberOfLines={1}>
                  {m.role}
                </Text>
              </View>
              <Pressable onPress={() => actions.toggleSaved(m.id)} hitSlop={12} accessibilityLabel={`Remove ${m.name} from saved`}>
                <Bookmark size={s(24)} color={colors.ink} fill={colors.lime} strokeWidth={1.8} />
              </Pressable>
            </Pressable>
          </SoftCard>
        ))}
        {members.length === 0 && (
          <Text style={[t.bodyInk, { textAlign: 'center', marginTop: s(40) }]}>
            Save profiles from the ⋯ menu on any member to find them here later.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: s(14), paddingRight: s(18) },
  role: { fontFamily: fonts.body, fontSize: s(15.5), color: colors.text },
});
