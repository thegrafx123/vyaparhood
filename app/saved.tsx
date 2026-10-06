import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../src/api/errors';
import { useSaved, useSetSaved } from '../src/api/hooks';
import { FadeUp, PressScale } from '../src/motion';
import { colors, fonts, s, shadow, TAB_PAD } from '../src/theme/tokens';
import { MemberPhoto } from '../src/ui/Avatar';
import { Empty, Loading } from '../src/ui/Cards';
import { HeaderRow } from '../src/ui/Header';
import { Bookmark } from '../src/ui/icons';
import { Screen } from '../src/ui/Screen';

/** 27 · Saved profiles. Tap the bookmark to remove. */
export default function Saved() {
  const router = useRouter();
  const { data = [], isLoading, error } = useSaved();
  const setSaved = useSetSaved();

  return (
    <Screen>
      <HeaderRow title="Saved profiles" titleSize={s(20)} pad={TAB_PAD} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(30), gap: s(12) }}>
        {isLoading ? <Loading /> : null}
        {error ? <Empty title="Couldn't load saved profiles" body={friendlyError(error)} /> : null}
        {!isLoading && !error && data.length === 0 ? (
          <Empty title="Nothing saved yet" body="Tap the bookmark on a member's profile to keep them here." />
        ) : null}
        {data.map((m, i) => (
          <FadeUp key={m.id} delay={100 + Math.min(i, 8) * 60}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.white,
                borderWidth: s(2.5),
                borderColor: colors.ink,
                borderRadius: s(20),
                boxShadow: shadow.softer,
              }}
            >
              <PressScale
                accessibilityRole="button"
                accessibilityLabel={`${m.full_name}, ${m.headline}`}
                onPress={() => router.push(`/member/${m.id}`)}
                scaleTo={0.98}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(12), padding: s(12) }}
              >
                <MemberPhoto path={m.photo_path} size={s(50)} radius={s(14)} verified={m.verified} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.displayBold, fontSize: s(14.5), color: colors.ink }}>
                    {m.full_name}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: s(12), color: colors.text }}>
                    {m.headline}
                  </Text>
                </View>
              </PressScale>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${m.full_name} from saved`}
                hitSlop={10}
                onPress={() => setSaved.mutate({ memberId: m.id, save: false })}
                style={{ paddingHorizontal: s(14), alignSelf: 'stretch', justifyContent: 'center' }}
              >
                <Bookmark size={s(18)} color={colors.ink} fill={colors.lime} />
              </Pressable>
            </View>
          </FadeUp>
        ))}
      </ScrollView>
    </Screen>
  );
}
