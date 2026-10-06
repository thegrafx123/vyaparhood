import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, Linking, Text, View } from 'react-native';
import { refreshLiveLocation } from '../src/lib/liveLocation';
import { Pulse } from '../src/motion';
import { getPermission, requestPermission } from '../src/services/location';
import { useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';
import { DialogButton, isIOS, SystemDialog } from '../src/ui/Dialog';
import { LogoMark } from '../src/ui/Header';
import { Pin } from '../src/ui/icons';
import { Screen } from '../src/ui/Screen';

type Stage = 'ask' | 'why' | 'locating';

/**
 * 1 · Location permission. The design's dialog over the dark splash.
 * Allow → the phone's own permission popup → city splash (2b).
 * Deny → we explain why Nearby needs it → deny again → onboarding (3).
 */
export default function LocationPrompt() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { session } = useAuth();
  const [stage, setStage] = useState<Stage>('ask');
  const [blocked, setBlocked] = useState(false);

  const proceed = async () => {
    setStage('locating');
    const live = await refreshLiveLocation({ signedIn: !!session, onFix: actions.setLive });
    if (live?.city && !state.flags.cityIntroShown) router.replace('/welcome-city');
    else router.replace('/onboarding/nearby');
  };

  const ask = async () => {
    const result = await requestPermission();
    if (result.status === 'granted') {
      actions.setFlag('locationDeclined', false);
      await proceed();
      return;
    }
    actions.setLive({ status: 'denied' });
    setBlocked(!result.canAskAgain);
    setStage('why');
  };

  const giveUp = () => {
    actions.setFlag('locationDeclined', true);
    router.replace('/onboarding/nearby');
  };

  // If they turn location on in Settings and come back, carry on.
  useEffect(() => {
    if (stage !== 'why' || !blocked) return;
    const sub = AppState.addEventListener('change', async (next) => {
      if (next !== 'active') return;
      const p = await getPermission();
      if (p.status === 'granted') proceed();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, blocked]);

  const askButtons: DialogButton[] = isIOS
    ? [
        { label: 'Continue', onPress: ask, bold: true, primary: true },
        { label: 'Not now', onPress: () => setStage('why') },
      ]
    : [
        { label: 'Allow While Using App', onPress: ask, bold: true, primary: true },
        { label: 'Allow Once', onPress: ask, primary: true },
        { label: "Don't Allow", onPress: () => setStage('why') },
      ];

  const whyButtons: DialogButton[] = [
    blocked
      ? { label: 'Open Settings', onPress: () => Linking.openSettings(), bold: true, primary: true }
      : { label: isIOS ? 'Continue' : 'Allow location', onPress: ask, bold: true, primary: true },
    { label: 'Continue without location', onPress: giveUp },
  ];

  return (
    <Screen bg={colors.splash} statusBar="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Pulse>
          <LogoMark size={s(68)} border={s(3)} borderColor={colors.lime} />
        </Pulse>
        <Text style={{ fontFamily: fonts.display, fontSize: s(17), color: colors.white, marginTop: s(14), letterSpacing: 0.3 }}>
          Vyaparhood
        </Text>
        {stage === 'locating' && (
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: s(13), color: colors.navyText, marginTop: s(10) }}>
            Finding your city…
          </Text>
        )}
      </View>

      {stage === 'ask' && (
        <SystemDialog
          key="ask"
          icon={<PinBadge />}
          title={isIOS ? 'Vyaparhood works best with your location' : 'Allow “Vyaparhood” to use your location?'}
          message="We use this to show you what's happening in your own city from the moment you open the app — nearby members, local requests, real distances."
          buttons={askButtons}
        />
      )}
      {stage === 'why' && (
        <SystemDialog
          key="why"
          icon={<PinBadge />}
          title="Location is needed to find businesses near you"
          message={
            blocked
              ? 'Location is turned off for Vyaparhood. Turn it on in Settings to see verified businesses around you and how far away they are.'
              : 'Nearby shows verified business owners around you with real distances. Without your location, Nearby search won’t work — you can still browse your city.'
          }
          buttons={whyButtons}
        />
      )}
    </Screen>
  );
}

function PinBadge() {
  return (
    <View
      style={{
        width: s(42),
        height: s(42),
        borderRadius: s(21),
        backgroundColor: colors.blueSoft2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Pin size={s(20)} color={colors.blue} />
    </View>
  );
}
