import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Text, View } from 'react-native';
import * as api from '../src/api';
import { SUPPORT_EMAIL } from '../src/config';
import { H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { PillButton } from '../src/ui/Buttons';
import { Screen } from '../src/ui/Screen';

/** Shown to suspended accounts. */
export default function Banned() {
  const router = useRouter();
  return (
    <Screen texture>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: H_PAD, gap: s(12) }}>
        <Text style={[t.pageTitle, { textAlign: 'center' }]}>Account suspended</Text>
        <Text style={[t.subtitle, { textAlign: 'center' }]}>
          Your account was suspended for breaking the Community Guidelines. If you think this is a mistake, write to {SUPPORT_EMAIL}.
        </Text>
        <PillButton label="Email support" size="lg" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={{ marginTop: s(12) }} />
        <PillButton
          label="Log out"
          size="lg"
          onPress={async () => {
            await api.auth.signOut();
            router.replace('/welcome');
          }}
        />
      </View>
    </Screen>
  );
}
