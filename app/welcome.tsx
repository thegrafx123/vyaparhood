import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { refreshLiveLocation } from '../src/lib/liveLocation';
import { getPermission } from '../src/services/location';
import { useApp } from '../src/state/AppStore';
import { SplashLayout } from '../src/ui/Splash';

/**
 * 2 · Splash — generic. First thing a new user sees.
 * "Get Started" → location dialog (1) → city splash (2b) or onboarding (3).
 */
export default function Welcome() {
  const router = useRouter();
  const { state, actions } = useApp();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const permission = await getPermission();
      if (permission.status === 'granted') {
        const live = state.live.city ? state.live : await refreshLiveLocation({ signedIn: false, onFix: actions.setLive });
        if (!state.flags.cityIntroShown && live?.city) router.push('/welcome-city');
        else router.push('/onboarding/nearby');
        return;
      }
      if (state.flags.locationDeclined || (permission.status === 'denied' && !permission.canAskAgain)) {
        router.push('/onboarding/nearby');
        return;
      }
      router.push('/location');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SplashLayout
      heading={["Your city's business,", { accent: 'sorted' }]}
      subtitle="Real business owners. Real conversations. Zero cold DMs."
      onStart={start}
      loading={busy}
    />
  );
}
