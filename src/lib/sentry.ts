import * as Sentry from '@sentry/react-native';
import { env } from './env';

let started = false;

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
  });
}

export function setSentryUser(userId: string | null) {
  if (!env.sentryDsn) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  console.warn('[error]', error, context ?? '');
  if (env.sentryDsn) Sentry.captureException(error, { extra: context });
}

export { Sentry };
