import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { RealtimeBridge } from '../../src/api/RealtimeBridge';
import { isActiveMember } from '../../src/api/types';
import { routeForMe } from '../../src/lib/routing';
import { useApp } from '../../src/state/AppStore';
import { useAuth } from '../../src/state/AuthProvider';
import { Loading } from '../../src/ui/Cards';
import { TabBar } from '../../src/ui/TabBar';

/** The main app is only reachable when signed in with access. */
export default function TabsLayout() {
  const { ready, session, me, meLoading } = useAuth();
  const { state } = useApp();

  if (!ready || meLoading) return <Loading />;
  if (!session) return <Redirect href="/welcome" />;
  if (!isActiveMember(me)) return <Redirect href={routeForMe(me, state.flags) as never} />;

  return (
    <>
      <RealtimeBridge />
      <Tabs screenOptions={{ headerShown: false, animation: 'fade' }} tabBar={(props) => <TabBar {...(props as any)} />}>
        <Tabs.Screen name="discover" />
        <Tabs.Screen name="requests" />
        <Tabs.Screen name="chats" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}
