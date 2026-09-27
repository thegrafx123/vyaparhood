// Deletes the calling user's account: their files in both buckets, then
// the auth user (which cascades to every table). Required by Apple and
// Google, and promised in the Privacy Policy.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function removeFolder(admin: ReturnType<typeof createClient>, bucket: string, folder: string) {
  const { data } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
  const paths = (data ?? []).map((f) => `${folder}/${f.name}`);
  if (paths.length) await admin.storage.from(bucket).remove(paths);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Identify the caller from their own JWT.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);
  const uid = userData.user.id;

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  try {
    await removeFolder(admin, 'avatars', uid);
    await removeFolder(admin, 'verification-docs', uid);
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error('delete-account failed', e);
    return json({ error: 'Could not delete account. Please contact support.' }, 500);
  }
});
