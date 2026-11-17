// Called by pg_cron (see supabase/cron_jobs.sql). Switches off paid
// memberships whose plan period has ended, by setting
// memberships.active = false. No data is deleted; the member is sent to
// the paywall until they renew.
// Protected by a shared secret instead of a user login.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import { withSentry } from '../_shared/sentry.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cronSecret = Deno.env.get('CRON_SECRET');

Deno.serve(withSentry('expire-memberships', async (req) => {
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Forbidden' }, 403);
  }
  // Sentry check: send header x-sentry-test: 1 (still needs the cron secret).
  if (req.headers.get('x-sentry-test') === '1') throw new Error('Sentry test: edge function error');
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await admin.rpc('expire_memberships');
  if (error) {
    console.error('expire_memberships failed', error);
    return json({ error: error.message }, 500);
  }
  return json({ expired: data ?? 0 });
}));
