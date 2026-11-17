import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { env } from './env';

let started = false;

/** Screen-to-screen timing. Hooked to the router in app/_layout.tsx. */
export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

/** Crash + error reporting. Does nothing until EXPO_PUBLIC_SENTRY_DSN is set. */
export function initSentry() {
  if (started || !env.sentryDsn) return;
  started = true;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnv,
    sendDefaultPii: false, // never send emails, IPs or request bodies
    tracesSampleRate: env.appEnv === 'production' ? 0.2 : 1.0,
    enableAutoSessionTracking: true,
    // Native crash handlers don't exist in Expo Go; JS errors still report.
    enableNative: !isRunningInExpoGo(),
    integrations: [navigationIntegration],
    // Set EXPO_PUBLIC_SENTRY_DEBUG=1 to see Sentry's own logs in Metro.
    debug: process.env.EXPO_PUBLIC_SENTRY_DEBUG === '1',
    beforeSend(event) {
      // Belt and braces on top of sendDefaultPii: drop anything that looks like an email.
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

export function setSentryUser(userId: string | null) {
  if (!env.sentryDsn) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  console.warn('[error]', error, context ?? '');
  if (!env.sentryDsn) return;
  // Supabase returns plain objects ({ message, code }) — wrap them so Sentry gets a stack and a title.
  const err =
    error instanceof Error
      ? error
      : Object.assign(new Error((error as { message?: string } | null)?.message ?? String(error)), { cause: error });
  Sentry.captureException(err, { extra: context });
}

export { Sentry };
