import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getNotificationsModule, registerPushToken } from '../services/notifications';
import { useAuth } from '../state/AuthProvider';

type PushData = { kind?: string; connection_id?: string | null };

/**
 * Keeps this phone's push token saved for the signed-in member and opens
 * the right screen when a push is tapped (same targets as the in-app
 * notifications list).
 */
export function PushBridge() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) registerPushToken();
  }, [userId]);

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;
    const open = (data: PushData | undefined) => {
      if (!data?.kind) return;
      if (data.kind === 'request') router.push('/requests');
      else if ((data.kind === 'message' || data.kind === 'approved') && data.connection_id)
        router.push(`/chat/${data.connection_id}`);
      else if (data.kind === 'badge') router.push('/profile');
    };
    // App opened from a push while it was closed.
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last.notification.request.content.data as PushData);
      Notifications.clearLastNotificationResponse();
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) =>
      open(r.notification.request.content.data as PushData),
    );
    return () => sub.remove();
  }, [router]);

  return null;
}
