import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env } from './env';
import { LargeSecureStore } from './secureStorage';

export const supabase = createClient(
  env.supabaseUrl || 'https://missing-config.supabase.co',
  env.supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh the login only while the app is on screen (Supabase's
// recommendation for React Native).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
