import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppStore';
import { BORDER, colors, fonts, s } from '../theme/tokens';
import { CircleUserRound, Compass, Inbox, MessageSquare } from './icons';

const TABS: Record<string, { label: string; Icon: typeof Compass }> = {
  discover: { label: 'Discover', Icon: Compass },
  requests: { label: 'Requests', Icon: Inbox },
  chats: { label: 'Chats', Icon: MessageSquare },
  profile: { label: 'Profile', Icon: CircleUserRound },
};

// Props come from expo-router's <Tabs tabBar={...} />. Typed loosely so this
// file doesn't depend on react-navigation's internal types.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: any) => any };
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { state: app } = useApp();
  const incoming = app.requests.filter((r) => r.direction === 'incoming').length;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, s(10)) }]}>
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
            accessibilityLabel={tab.label}
            style={styles.item}
          >
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Icon size={s(21)} color={focused ? colors.white : '#8B96AE'} strokeWidth={2.1} />
              {route.name === 'requests' && incoming > 0 && !focused && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{incoming}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, focused && { color: colors.blue }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: BORDER,
    borderTopColor: colors.ink,
    backgroundColor: colors.white,
    paddingTop: s(12),
  },
  item: { flex: 1, alignItems: 'center' },
  iconWrap: {
    width: s(46),
    height: s(46),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: colors.blue, borderWidth: BORDER, borderColor: colors.ink },
  label: { fontFamily: fonts.displayBold, fontSize: s(13.5), color: '#8B96AE', marginTop: s(2) },
  badge: {
    position: 'absolute',
    top: s(2),
    right: s(4),
    minWidth: s(17),
    height: s(17),
    borderRadius: s(9),
    backgroundColor: colors.alert,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(3),
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: s(10.5), color: colors.white },
});
