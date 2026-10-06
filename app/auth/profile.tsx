import { useRouter } from 'expo-router';
import React from 'react';
import { ProfileForm } from '../../src/features/ProfileForm';
import { routeForMe } from '../../src/lib/routing';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { Loading } from '../../src/ui/Cards';
import { HeaderRow } from '../../src/ui/Header';
import { KeyboardArea, Screen } from '../../src/ui/Screen';

/** 10 · Create profile (with the business address). */
export default function CreateProfile() {
  const router = useRouter();
  const { me, refreshMe } = useAuth();
  const { state } = useApp();

  return (
    <Screen texture>
      <KeyboardArea>
        <HeaderRow title="Set up your profile" />
        {me ? (
          <ProfileForm
            me={me}
            mode="create"
            onSaved={async () => {
              const fresh = await refreshMe();
              router.replace(routeForMe(fresh, state.flags) as never);
            }}
          />
        ) : (
          <Loading />
        )}
      </KeyboardArea>
    </Screen>
  );
}
