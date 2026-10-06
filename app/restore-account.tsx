import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import * as api from '../src/api';
import { friendlyError } from '../src/api/errors';
import { DELETE_AFTER_DAYS } from '../src/config';
import { routeForMe } from '../src/lib/routing';
import { FadeUp } from '../src/motion';
import { useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, H_PAD, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { CtaButton, PillButton } from '../src/ui/Buttons';
import { Helper } from '../src/ui/Form';
import { AccentHeading } from '../src/ui/Heading';
import { Footer, Screen } from '../src/ui/Screen';

/** Shown when someone who asked to delete their account signs back in. */
export default function RestoreAccount() {
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const { state, actions } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requested = me?.profile.deletion_requested_at;
  const on = requested ? new Date(new Date(requested).getTime() + DELETE_AFTER_DAYS * 86400000) : null;

  const restore = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.me.cancelDeletion();
      const fresh = await refreshMe();
      router.replace(routeForMe(fresh, state.flags) as never);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  const leave = async () => {
    await api.auth.signOut();
    actions.resetSession();
    router.replace('/welcome');
  };

  return (
    <Screen texture>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: H_PAD }}>
        <FadeUp delay={60}>
          <AccentHeading parts={['Welcome', { accent: 'back', drawDelay: 450 }]} size={30} accentSize={36} />
        </FadeUp>
        <FadeUp delay={140}>
          <Text style={[t.subtitle, { marginTop: s(12) }]}>
            Your account is scheduled to be deleted
            {on ? ` on ${on.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}. Your profile
            is hidden from other members until then.
          </Text>
          <Text style={[t.subtitle, { marginTop: s(10), color: colors.ink }]}>Restore it to pick up right where you left off.</Text>
        </FadeUp>
        {error ? <Helper error>{error}</Helper> : null}
      </View>
      <FadeUp delay={220}>
        <Footer style={{ gap: s(12) }}>
          <CtaButton label="Restore my account" icon="check" onPress={restore} loading={busy} />
          <PillButton label="Keep it deleted & log out" size="lg" onPress={leave} />
        </Footer>
      </FadeUp>
    </Screen>
  );
}
