import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSaved, useSetSaved } from '../src/api/hooks';
import { Bookmark } from '../src/components/icons';
import { HeaderRow, Screen, SoftCard } from '../src/components/Layout';
import { MemberAvatar } from '../src/components/MemberAvatar';
import { colors, fonts, s, TAB_PAD } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

/** 29 · Saved profiles. */
export default function Saved() {
  const router = useRouter();
  const { data = [], isLoading } = useSaved();
  const setSaved = useSetSaved();

  return (
    <Screen>
      <HeaderRow title="Saved profiles" style={{ paddingHorizontal: TAB_PAD }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(22), paddingBottom: s(30) }}>
        {isLoading && <ActivityIndicator color={colors.blue} />}
        {data.map((m) => (
          <SoftCard key={m.id} radius={s(24)} style={{ marginBottom: s(14) }}>
            <Pressable style={styles.row} onPress={() => router.push(`/member/${m.id}`)}>
              <MemberAvatar path={m.photo_path} size={s(50)} radius={s(14)} />
              <View style={{ flex: 1, marginLeft: s(14) }}>
                <Text style={t.name}>{m.full_name}</Text>
                <Text style={styles.role} numberOfLines={1}>
                  {m.headline}
                </Text>
              </View>
              <Pressable onPress={() => setSaved.mutate({ memberId: m.id, save: false })} hitSlop={12} accessibilityLabel={`Remove ${m.full_name} from saved`}>
                <Bookmark size={s(24)} color={colors.ink} fill={colors.lime} strokeWidth={1.8} />
              </Pressable>
            </Pressable>
          </SoftCard>
        ))}
        {!isLoading && data.length === 0 && (
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
