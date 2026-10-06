import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useApp } from '../src/state/AppStore';
import { SplashLayout } from '../src/ui/Splash';

/**
 * 2b · Splash — personalised with the city we just detected
 * ("Your Surat business, sorted"). Shown once, right after the member
 * allows location.
 */
export default function WelcomeCity() {
  const router = useRouter();
  const { state, actions } = useApp();
  const city = state.live.city ?? 'city';

  useEffect(() => {
    actions.setFlag('cityIntroShown', true);
  }, [actions]);

  return (
    <SplashLayout
      city={state.live.city}
      heading={['Your', { accent: city }, 'business, sorted']}
      subtitle={`Real business owners in ${state.live.city ?? 'your city'}. Real conversations. Zero cold DMs.`}
      onStart={() => router.replace('/onboarding/nearby')}
    />
  );
}
