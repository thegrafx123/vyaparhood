import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { routeForMe } from '../../src/lib/routing';
import { FadeUp } from '../../src/motion';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { H_PAD, s } from '../../src/theme/tokens';
import { CtaButton } from '../../src/ui/Buttons';
import { CityPicker } from '../../src/ui/CityPicker';
import { Helper } from '../../src/ui/Form';
import { BackButton } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Footer, KeyboardArea, Screen } from '../../src/ui/Screen';

/** 9 · City picker — the city the member's business is in. */
export default function CityStep() {
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const { state } = useApp();
  const [city, setCity] = useState<string | null>(me?.profile.city ?? state.live.city ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    if (!city) return;
    setBusy(true);
    setError(null);
    try {
      await api.me.update({ city });
      const fresh = await refreshMe();
      router.push(routeForMe(fresh, state.flags) as never);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen texture>
      <KeyboardArea>
        <FadeUp delay={20} style={{ paddingHorizontal: s(24), paddingTop: s(22), flexDirection: 'row' }}>
          <BackButton />
        </FadeUp>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: s(20) }}>
          <FadeUp delay={100} style={{ paddingTop: s(20), marginBottom: s(20) }}>
            <AccentHeading parts={['Where are you', { accent: 'building', suffix: '?', drawDelay: 500 }]} size={28} accentSize={34} />
          </FadeUp>
          <CityPicker value={city} onChange={setCity} suggested={state.live.city} />
          {error ? <Helper error>{error}</Helper> : null}
        </ScrollView>
        <View>
          <FadeUp delay={620}>
            <Footer style={{ paddingTop: s(12) }}>
              <CtaButton label="Continue" onPress={next} disabled={!city} loading={busy} />
            </Footer>
          </FadeUp>
        </View>
      </KeyboardArea>
    </Screen>
  );
}
