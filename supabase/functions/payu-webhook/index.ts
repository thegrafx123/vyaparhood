// PayU server-to-server webhook (PayU Dashboard → Developers → Webhooks,
// "Payments" success + failure). Backup for payu-return when the member
// closes the app mid-payment.
import { json } from '../_shared/cors.ts';
import { withSentry } from '../_shared/sentry.ts';
import { readForm, settleFromPost } from '../_shared/payu.ts';

Deno.serve(withSentry('payu-webhook', async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const p = await readForm(req);
  const { status, txnid } = await settleFromPost(p);
  if (status === 'invalid') return json({ error: 'Invalid hash' }, 400);
  return json({ ok: true, txnid, status });
}));
