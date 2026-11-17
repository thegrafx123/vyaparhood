// PayU helpers shared by the payu-* Edge Functions.
// Secrets (npx supabase secrets set ...):
//   PAYU_KEY, PAYU_SALT   merchant key + salt (v1) from the PayU dashboard
//   PAYU_ENV              'test' or 'production' (default 'test')
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const PAYU_KEY = Deno.env.get('PAYU_KEY') ?? '';
const PAYU_SALT = Deno.env.get('PAYU_SALT') ?? '';
const LIVE = Deno.env.get('PAYU_ENV') === 'production';

export const PAYU_CHECKOUT_URL = LIVE ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment';
const PAYU_VERIFY_URL = LIVE
  ? 'https://info.payu.in/merchant/postservice.php?form=2'
  : 'https://test.payu.in/merchant/postservice.php?form=2';

export const payuReady = () => PAYU_KEY.length > 0 && PAYU_SALT.length > 0;

/** Server-side prices. The app's numbers are display only. Must match plan_price() in SQL. */
export const PLANS: Record<string, { amount: string; label: string }> = {
  weekly_99: { amount: '99.00', label: 'Vyaparhood 1 Week' },
  monthly_299: { amount: '299.00', label: 'Vyaparhood Monthly' },
};

export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

export async function sha512(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface HashFields {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

/** key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||SALT */
export const requestHash = (f: HashFields) =>
  sha512(
    [
      PAYU_KEY, f.txnid, f.amount, f.productinfo, f.firstname, f.email,
      f.udf1 ?? '', f.udf2 ?? '', f.udf3 ?? '', f.udf4 ?? '', f.udf5 ?? '',
      '', '', '', '', '', PAYU_SALT,
    ].join('|'),
  );

/** Checks the reverse hash PayU sends with surl/furl/webhook posts. */
export async function responseHashValid(p: Record<string, string>): Promise<boolean> {
  if (!p.hash || p.key !== PAYU_KEY) return false;
  const parts = [
    PAYU_SALT, p.status ?? '', '', '', '', '', '',
    p.udf5 ?? '', p.udf4 ?? '', p.udf3 ?? '', p.udf2 ?? '', p.udf1 ?? '',
    p.email ?? '', p.firstname ?? '', p.productinfo ?? '', p.amount ?? '', p.txnid ?? '', PAYU_KEY,
  ];
  if (p.additional_charges) parts.unshift(p.additional_charges);
  return (await sha512(parts.join('|'))) === p.hash.toLowerCase();
}

type VerifyResult = {
  status: string;
  amt: string;
  mihpayid: string;
  mode?: string;
  error_Message?: string;
  field9?: string;
};

/** Asks PayU directly what happened to a transaction (never trust the client). */
export async function verifyWithPayU(txnid: string): Promise<VerifyResult | null> {
  const command = 'verify_payment';
  const hash = await sha512([PAYU_KEY, command, txnid, PAYU_SALT].join('|'));
  const res = await fetch(PAYU_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ key: PAYU_KEY, command, var1: txnid, hash }),
  });
  if (!res.ok) throw new Error(`PayU verify HTTP ${res.status}`);
  const body = await res.json();
  return (body?.transaction_details?.[txnid] as VerifyResult | undefined) ?? null;
}

export type SettleStatus = 'success' | 'failed' | 'cancelled' | 'mismatch' | 'pending' | 'invalid';

/**
 * Re-checks a txnid with PayU's verify API and records the result.
 * Idempotent: safe to run from surl, webhook and app polling.
 */
export async function settleTxn(txnid: string, hint?: Record<string, string>): Promise<SettleStatus> {
  const v = await verifyWithPayU(txnid);
  const raw = (v?.status ?? '').toLowerCase();
  if (!v || raw === 'pending' || raw === 'not found' || raw === 'in progress' || raw === '') return 'pending';
  const ok = raw === 'success';
  const status = ok ? 'success' : hint?.unmappedstatus === 'userCancelled' ? 'cancelled' : 'failed';

  const { data, error } = await admin().rpc('payu_settle_payment', {
    p_txnid: txnid,
    p_status: status,
    p_amount: Number(v.amt),
    p_payu_id: v.mihpayid ?? hint?.mihpayid ?? null,
    p_mode: v.mode ?? hint?.mode ?? null,
    p_payu_status: v.status,
    p_error: ok ? null : (v.error_Message ?? hint?.error_Message ?? v.field9 ?? null),
    p_raw: v,
  });
  if (error) throw error;
  return data as SettleStatus;
}

/** Verifies a PayU POST (hash first, then PayU's verify API) and records it. */
export async function settleFromPost(p: Record<string, string>): Promise<{ status: SettleStatus; txnid: string }> {
  const txnid = p.txnid ?? '';
  if (!txnid) return { status: 'invalid', txnid };
  if (!(await responseHashValid(p))) {
    console.error('PayU hash mismatch', txnid);
    return { status: 'invalid', txnid };
  }
  return { status: await settleTxn(txnid, p), txnid };
}

export async function readForm(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return await req.json();
  const form = await req.formData();
  const out: Record<string, string> = {};
  form.forEach((v, k) => (out[k] = String(v)));
  return out;
}
