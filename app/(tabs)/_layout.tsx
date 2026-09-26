import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { TabBar } from '../../src/components/TabBar';
import { useApp } from '../../src/state/AppStore';

/** The main app is only reachable with an active membership. */
export default function TabsLayout() {
  const { state } = useApp();
  if (!state.entitlement.active) return <Redirect href="/paywall" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...(props as any)} />}>
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
