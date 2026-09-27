import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as api from '../src/api';
import { OutlineButton } from '../src/components/Buttons';
import { Screen } from '../src/components/Layout';
import { SUPPORT_EMAIL } from '../src/config';
import { H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';

/** Shown to suspended accounts. */
export default function Banned() {
  return (
    <Screen>
      <View style={styles.center}>
        <Text style={[t.h1, { textAlign: 'center' }]}>Account suspended</Text>
        <Text style={[t.subtitle, { textAlign: 'center', marginTop: s(10) }]}>
          Your account was suspended for breaking the Community Guidelines. If you think this is a mistake,
          write to {SUPPORT_EMAIL}.
        </Text>
        <OutlineButton label="Email support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={{ marginTop: s(24), alignSelf: 'stretch' }} />
        <OutlineButton label="Log out" onPress={() => api.auth.signOut()} style={{ marginTop: s(12), alignSelf: 'stretch' }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', paddingHorizontal: H_PAD } });
