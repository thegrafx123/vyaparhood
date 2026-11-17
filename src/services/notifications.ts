import { isRunningInExpoGo } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Push notifications, end to end:
 *   1. ask permission (slide 13)
 *   2. get this phone's Expo push token and save it in `push_tokens`
 *   3. the database calls the `send-push` Edge Function whenever a
 *      notification row or chat message is created (see migration
 *      20261104000000_push_notifications.sql)
 *   4. tapping a push opens the matching screen (usePushRouting)
 *
 * Expo Go on Android has no remote-push support since SDK 53 and even
 * importing expo-notifications crashes there, so everything here is a
 * no-op in Expo Go on Android. Use a development build to test push.
 */
export const pushSupported = !(
  Platform.OS === 'android' &&
  (isRunningInExpoGo() || Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
);

let openChatId: string | null = null;
/** The chat screen sets this while it is on screen. */
export function setOpenChat(id: string | null) {
  openChatId = id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mod: any | null | undefined;
/** Loaded lazily so Expo Go never touches the native module. */
function N(): typeof import('expo-notifications') | null {
  if (mod !== undefined) return mod;
  if (!pushSupported) return (mod = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('expo-notifications');
    mod.setNotificationHandler({
      // No banner for a message in the chat that is already open.
      handleNotification: async (n: { request: { content: { data?: { connection_id?: string } } } }) => {
        const inOpenChat = !!openChatId && n.request.content.data?.connection_id === openChatId;
        return {
          shouldShowBanner: !inOpenChat,
          shouldShowList: !inOpenChat,
          shouldPlaySound: !inOpenChat,
          shouldSetBadge: false,
        };
      },
    });
  } catch (e) {
    console.warn('[notifications] module unavailable', e);
    mod = null;
  }
  return mod;
}

export function getNotificationsModule() {
  return N();
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = N();
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Requests & messages',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return !!result.granted;
  } catch (e) {
    console.warn('[notifications] permission request failed', e);
    return false;
  }
}

let registeredToken: string | null = null;

/** Saves this phone's push token for the signed-in member. Safe to call often. */
export async function registerPushToken(): Promise<void> {
  const Notifications = N();
  if (!Notifications) return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Requests & messages',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[notifications] no EAS projectId — run `eas init` so push tokens can be issued');
      return;
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('claim_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) throw error;
    registeredToken = token;
  } catch (e) {
    console.warn('[notifications] token registration failed', e);
  }
}

/** Call before signing out so the old account stops getting pushes on this phone. */
export async function unregisterPushToken(): Promise<void> {
  if (!registeredToken) return;
  try {
    await supabase.from('push_tokens').delete().eq('token', registeredToken);
  } catch {
    // best effort
  }
  registeredToken = null;
}
