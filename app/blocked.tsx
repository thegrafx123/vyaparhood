import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../src/api/errors';
import { useBlocked, useUnblock } from '../src/api/hooks';
import { FadeUp } from '../src/motion';
import { colors, fonts, s, shadow, TAB_PAD } from '../src/theme/tokens';
import { MemberPhoto } from '../src/ui/Avatar';
import { PillButton } from '../src/ui/Buttons';
import { Empty, Loading } from '../src/ui/Cards';
import { HeaderRow } from '../src/ui/Header';
import { Screen } from '../src/ui/Screen';

/** Members you've blocked (Settings → Privacy). */
export default function Blocked() {
  const { data = [], isLoading, error } = useBlocked();
  const unblock = useUnblock();

  return (
    <Screen>
      <HeaderRow title="Blocked members" titleSize={s(20)} pad={TAB_PAD} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(18), paddingBottom: s(30), gap: s(12) }}>
        {isLoading ? <Loading /> : null}
        {error ? <Empty title="Couldn't load" body={friendlyError(error)} /> : null}
        {!isLoading && !error && data.length === 0 ? <Empty title="No one blocked" body="People you block won't see you or be able to contact you." /> : null}
        {data.map((m, i) => (
          <FadeUp key={m.id} delay={100 + Math.min(i, 8) * 60}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: s(12),
                backgroundColor: colors.white,
                borderWidth: s(2.5),
                borderColor: colors.ink,
                borderRadius: s(20),
                padding: s(12),
                boxShadow: shadow.softer,
              }}
            >
              <MemberPhoto path={m.photo_path} size={s(46)} radius={s(14)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.displayBold, fontSize: s(14.5), color: colors.ink }}>
                  {m.full_name}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: s(12), color: colors.text }}>
                  {m.headline}
                </Text>
              </View>
              <PillButton
                label="Unblock"
                loading={unblock.isPending && unblock.variables === m.id}
                onPress={() => unblock.mutate(m.id, { onError: (e) => Alert.alert('Could not unblock', friendlyError(e)) })}
              />
            </View>
          </FadeUp>
        ))}
      </ScrollView>
    </Screen>
  );
}
