// Called by the app with the member's JWT.
//   POST { planId }          → creates a payment at the server-side price
//                              and returns signed PayU checkout fields.
//   POST { checkTxnid }      → re-checks one of the member's own payments
//                              with PayU (used if the redirect was missed).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { withSentry } from '../_shared/sentry.ts';
import { admin, PAYU_CHECKOUT_URL, PAYU_KEY, payuReady, PLANS, requestHash, settleTxn } from '../_shared/payu.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(withSentry('payu-create-order', async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!payuReady()) return json({ error: "Payments aren't set up yet." }, 503);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Not signed in' }, 401);

  const body = await req.json().catch(() => ({}));
  const db = admin();

  // --- Status re-check -------------------------------------------------
  if (typeof body.checkTxnid === 'string') {
    const { data: pay } = await db
      .from('payments')
      .select('status')
      .eq('txnid', body.checkTxnid)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!pay) return json({ error: 'Payment not found' }, 404);
    if (pay.status !== 'created') return json({ status: pay.status });
    return json({ status: await settleTxn(body.checkTxnid) });
  }

  // --- New order -------------------------------------------------------
  const planId = body.planId as string;
  const plan = PLANS[planId];
  if (!plan) return json({ error: 'Unknown plan' }, 400);

  const { data: profile, error: pErr } = await db
    .from('profiles')
    .select('full_name, email, phone, is_banned, deletion_requested_at')
    .eq('id', user.id)
    .single();
  if (pErr || !profile) return json({ error: 'Profile not found' }, 404);
  if (profile.is_banned || profile.deletion_requested_at) return json({ error: 'Account not available' }, 403);

  const email = String(profile.email || user.email || '').trim();
  const phone = String(profile.phone ?? '').replace(/\D/g, '').slice(-10);
  // PayU accepts letters and spaces in firstname.
  const firstname = String(profile.full_name || '').replace(/[^A-Za-z ]/g, '').trim().slice(0, 60) || 'Member';
  if (!email) return json({ error: 'Add an email to your account first.' }, 400);
  if (phone.length !== 10) return json({ error: 'Add your mobile number in Edit profile first.' }, 400);

  // Unique, alphanumeric, ≤ 25 chars.
  const txnid = ('VH' + Date.now().toString(36) + crypto.randomUUID().replace(/-/g, '').slice(0, 12)).toUpperCase();

  const { error: insErr } = await db.from('payments').insert({
    txnid, user_id: user.id, plan_id: planId, amount: Number(plan.amount),
  });
  if (insErr) throw insErr;

  const returnUrl = `${url}/functions/v1/payu-return`;
  const fields: Record<string, string> = {
    key: PAYU_KEY,
    txnid,
    amount: plan.amount,
    productinfo: plan.label,
    firstname,
    email,
    phone,
    udf1: user.id,
    udf2: planId,
    surl: returnUrl,
    furl: returnUrl,
  };
  fields.hash = await requestHash({
    txnid, amount: plan.amount, productinfo: plan.label, firstname, email, udf1: user.id, udf2: planId,
  });

  return json({ txnid, action: PAYU_CHECKOUT_URL, fields });
}));
