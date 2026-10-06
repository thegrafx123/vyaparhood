import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { ProfileForm } from '../src/features/ProfileForm';
import { useAuth } from '../src/state/AuthProvider';
import { Loading } from '../src/ui/Cards';
import { HeaderRow } from '../src/ui/Header';
import { KeyboardArea, Screen } from '../src/ui/Screen';

/** 26 · Edit profile — including the photo and the business address. */
export default function EditProfile() {
  const router = useRouter();
  const qc = useQueryClient();
  const { me, refreshMe } = useAuth();

  return (
    <Screen texture>
      <KeyboardArea>
        <HeaderRow title="Edit profile" />
        {me ? (
          <ProfileForm
            me={me}
            mode="edit"
            onSaved={async () => {
              await refreshMe();
              qc.invalidateQueries({ queryKey: ['discover'] });
              qc.invalidateQueries({ queryKey: ['discoveryContext'] });
              router.back();
            }}
          />
        ) : (
          <Loading />
        )}
      </KeyboardArea>
    </Screen>
  );
}
