// Called daily by pg_cron (see supabase/cron_jobs.sql). Permanently
// deletes verification files older than their delete_after date.
// Protected by a shared secret instead of a user login.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cronSecret = Deno.env.get('CRON_SECRET');

Deno.serve(async (req) => {
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Forbidden' }, 403);
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: docs, error } = await admin
    .from('verification_documents')
    .select('id, storage_path')
    .is('purged_at', null)
    .lte('delete_after', new Date().toISOString())
    .limit(500);
  if (error) return json({ error: error.message }, 500);
  if (!docs?.length) return json({ purged: 0 });

  const { error: removeError } = await admin.storage
    .from('verification-docs')
    .remove(docs.map((d) => d.storage_path));
  if (removeError) return json({ error: removeError.message }, 500);

  const { error: updateError } = await admin
    .from('verification_documents')
    .update({ purged_at: new Date().toISOString() })
    .in('id', docs.map((d) => d.id));
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ purged: docs.length });
});
