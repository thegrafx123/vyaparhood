// Called daily by pg_cron (see supabase/cron_jobs.sql). Permanently
// deletes accounts whose owner asked for deletion more than 30 days ago
// and didn't sign back in to restore them: their photo, then the auth
// user (which cascades to every table).
// Protected by a shared secret instead of a user login.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cronSecret = Deno.env.get('CRON_SECRET');

const GRACE_DAYS = 30;

Deno.serve(async (req) => {
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Forbidden' }, 403);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: due, error } = await admin
    .from('profiles')
    .select('id')
    .not('deletion_requested_at', 'is', null)
    .lte('deletion_requested_at', cutoff)
    .limit(200);
  if (error) return json({ error: error.message }, 500);
  if (!due?.length) return json({ deleted: 0 });

  let deleted = 0;
  const failed: string[] = [];
  for (const { id } of due) {
    try {
      await admin.storage.from('avatars').remove([`${id}/avatar.jpg`]);
      const { error: deleteError } = await admin.auth.admin.deleteUser(id);
      if (deleteError) throw deleteError;
      deleted += 1;
    } catch (e) {
      console.error('purge failed for', id, e);
      failed.push(id);
    }
  }
  return json({ deleted, failed: failed.length });
});
