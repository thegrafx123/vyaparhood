import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequests } from '../api/hooks';
import { colors, fonts, s } from '../theme/tokens';
import { Chat, Compass, Inbox, User } from './icons';

const TABS: Record<string, { label: string; Icon: typeof Compass }> = {
  discover: { label: 'Discover', Icon: Compass },
  requests: { label: 'Requests', Icon: Inbox },
  chats: { label: 'Chats', Icon: Chat },
  profile: { label: 'Profile', Icon: User },
};

// Props come from expo-router's <Tabs tabBar={...} />. Typed loosely so this
// file doesn't depend on react-navigation's internal types.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: any) => any };
};

/** Bottom tab bar: white, ink top border, active tab in a blue tile. */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { data: requests } = useRequests();
  const incoming = (requests ?? []).filter((r) => r.direction === 'incoming').length;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderTopWidth: s(2.5),
        borderTopColor: colors.ink,
        paddingTop: s(12),
        paddingHorizontal: s(24),
        paddingBottom: Math.max(insets.bottom, s(22)),
      }}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const { Icon } = tab;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event?.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={route.name === 'requests' && incoming > 0 ? `${tab.label}, ${incoming} new` : tab.label}
            style={{ alignItems: 'center', gap: s(4), minWidth: s(56) }}
          >
            <View
              style={[
                { width: s(40), height: s(40), alignItems: 'center', justifyContent: 'center' },
                focused && { borderRadius: s(14), backgroundColor: colors.blue, borderWidth: s(2), borderColor: colors.ink },
              ]}
            >
              <Icon size={focused ? s(19) : s(20)} color={focused ? colors.white : colors.muted} />
              {route.name === 'requests' && incoming > 0 && !focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: s(2),
                    right: s(4),
                    minWidth: s(19),
                    height: s(19),
                    paddingHorizontal: s(2),
                    borderRadius: s(10),
                    backgroundColor: colors.peach,
                    borderWidth: s(2),
                    borderColor: colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(9), color: colors.white }}>{incoming}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(10), color: focused ? colors.blue : colors.muted }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
