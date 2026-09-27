/**
 * Values come from .env.development / .env.production locally, and from
 * eas.json for EAS builds. EXPO_PUBLIC_* values are bundled into the app,
 * so only public keys belong here (the Supabase anon key IS public — the
 * database's row-level security is what protects data).
 * NEVER put the Supabase service_role key in the app.
 */
export type AppEnv = 'development' | 'production';

export const env = {
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 'production' : 'development') as AppEnv,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
};

export const envReady = env.supabaseUrl.startsWith('https://') && env.supabaseAnonKey.length > 20;
