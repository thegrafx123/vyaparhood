import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { routeForMe } from '../../src/lib/routing';
import { requestNotificationPermission } from '../../src/services/notifications';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { s } from '../../src/theme/tokens';
import { isIOS, SystemDialog } from '../../src/ui/Dialog';
import { Brand, LogoMark } from '../../src/ui/Header';
import { Screen } from '../../src/ui/Screen';

/** 13 · Enable notifications — the design's dialog over a faded app preview. */
export default function EnableNotifications() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { me } = useAuth();

  const finish = () => {
    actions.setFlag('notificationsPrompted', true);
    router.replace(routeForMe(me, { ...state.flags, notificationsPrompted: true }) as never);
  };

  const allow = async () => {
    await requestNotificationPermission();
    finish();
  };

  return (
    <Screen bg="#EDEFF4">
      <View style={{ paddingTop: s(40), paddingHorizontal: s(26), opacity: 0.5 }}>
        <Brand />
        <View style={{ marginTop: s(40), height: s(14), width: '70%', backgroundColor: '#D4D9E4', borderRadius: s(5) }} />
        <View style={{ marginTop: s(12), height: s(90), backgroundColor: '#D4D9E4', borderRadius: s(16) }} />
        <View style={{ marginTop: s(12), height: s(90), backgroundColor: '#D4D9E4', borderRadius: s(16) }} />
      </View>
      <SystemDialog
        width={s(270)}
        layout="row"
        dim="rgba(15,20,35,0.42)"
        icon={<LogoMark size={s(40)} border={0} />}
        title={isIOS ? 'Get notified about requests & messages' : '“Vyaparhood” Would Like to Send You Notifications'}
        message="We'll let you know about new requests, messages and connection approvals."
        buttons={
          isIOS
            ? [
                { label: 'Not now', onPress: finish },
                { label: 'Continue', onPress: allow, bold: true, primary: true },
              ]
            : [
                { label: "Don't Allow", onPress: finish },
                { label: 'Allow', onPress: allow, bold: true, primary: true },
              ]
        }
      />
    </Screen>
  );
}
