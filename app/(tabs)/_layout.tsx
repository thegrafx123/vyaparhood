import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { RealtimeBridge } from '../../src/api/RealtimeBridge';
import { isActiveMember } from '../../src/api/types';
import { TabBar } from '../../src/components/TabBar';
import { useAuth } from '../../src/state/AuthProvider';
import { colors } from '../../src/theme/tokens';

/** The main app is only reachable when signed in with an active membership. */
export default function TabsLayout() {
  const { ready, session, me, meLoading } = useAuth();

  if (!ready || meLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }
  if (!session) return <Redirect href="/welcome" />;
  if (me?.profile.is_banned) return <Redirect href="/banned" />;
  if (!isActiveMember(me)) return <Redirect href="/paywall" />;

  return (
    <>
      <RealtimeBridge />
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...(props as any)} />}>
        <Tabs.Screen name="discover" />
        <Tabs.Screen name="requests" />
        <Tabs.Screen name="chats" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}
