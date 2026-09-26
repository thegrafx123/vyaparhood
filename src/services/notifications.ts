/**
 * Only asks for permission for now. Push tokens (FCM/APNs) are registered
 * later, once the backend exists. Remote push is not available inside
 * Expo Go on Android, which is fine for this prototype — the permission
 * prompt still works.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return !!result.granted;
  } catch (e) {
    console.warn('[notifications] permission request failed', e);
    return false;
  }
}
