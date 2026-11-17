// Called by the database (dispatch_push, see migration
// 20261104000000_push_notifications.sql) for every new request,
// approval, badge and chat message. Looks up the recipient's phones,
// sends through the Expo push service, and drops tokens Expo reports as
// no longer registered.
// Protected by the same shared secret as the cron functions.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import { withSentry } from '../_shared/sentry.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cronSecret = Deno.env.get('CRON_SECRET');
// Optional: only needed if "enhanced push security" is on in Expo.
const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');

type Payload = {
  kind: 'request' | 'approved' | 'badge' | 'message';
  user_id: string;
  actor_id: string | null;
  connection_id: string | null;
  body?: string;
};

function copy(p: Payload, actor: string) {
  switch (p.kind) {
    case 'request':
      return { title: 'New connection request', body: `${actor} wants to connect with you.` };
    case 'approved':
      return { title: 'Request approved', body: `${actor} accepted your request. Say hello!` };
    case 'message':
      return { title: actor, body: p.body ?? 'Sent you a message' };
    case 'badge':
      return { title: 'You are verified', body: 'Your verified badge is now on your profile.' };
  }
}

Deno.serve(withSentry('send-push', async (req) => {
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Forbidden' }, 403);
  }
  const p = (await req.json().catch(() => null)) as Payload | null;
  if (!p?.user_id || !p.kind) return json({ error: 'Bad payload' }, 400);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Banned, deleting, or lapsed members get nothing. The verified badge can
  // land before onboarding is finished, so it only needs a live account.
  const { data: recipient } = await admin
    .from('profiles')
    .select('is_banned, deletion_requested_at')
    .eq('id', p.user_id)
    .maybeSingle();
  if (!recipient || recipient.is_banned || recipient.deletion_requested_at) {
    return json({ sent: 0, reason: 'recipient inactive' });
  }
  if (p.kind !== 'badge') {
    const { data: active } = await admin.rpc('is_active_member', { uid: p.user_id });
    if (active !== true) return json({ sent: 0, reason: 'recipient not a member' });
  }

  if (p.actor_id) {
    const { data: listed } = await admin.rpc('is_listed', { uid: p.actor_id });
    if (listed !== true) return json({ sent: 0, reason: 'actor hidden' });
    const { data: blocked } = await admin.rpc('is_blocked_between', { a: p.user_id, b: p.actor_id });
    if (blocked === true) return json({ sent: 0, reason: 'blocked' });
  }

  const { data: tokens, error } = await admin.from('push_tokens').select('token').eq('user_id', p.user_id);
  if (error) return json({ error: error.message }, 500);
  if (!tokens?.length) return json({ sent: 0 });

  let actor = 'Someone';
  if (p.actor_id) {
    const { data } = await admin.from('profiles').select('full_name').eq('id', p.actor_id).maybeSingle();
    if (data?.full_name) actor = data.full_name;
  }
  const { title, body } = copy(p, actor);

  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    sound: 'default',
    channelId: 'default',
    data: { kind: p.kind, connection_id: p.connection_id },
  }));

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(expoToken ? { Authorization: `Bearer ${expoToken}` } : {}),
    },
    body: JSON.stringify(messages),
  });
  const out = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('expo push failed', res.status, out);
    return json({ error: 'expo push failed' }, 502);
  }

  const dead: string[] = (out?.data ?? [])
    .map((r: { status: string; details?: { error?: string } }, i: number) =>
      r.status === 'error' && r.details?.error === 'DeviceNotRegistered' ? messages[i].to : null,
    )
    .filter((t: string | null): t is string => !!t);
  if (dead.length) await admin.from('push_tokens').delete().in('token', dead);

  return json({ sent: messages.length, removed: dead.length });
}));
