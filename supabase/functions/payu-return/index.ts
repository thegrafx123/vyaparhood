// PayU's surl/furl. The checkout page in the app's WebView POSTs the
// result here; we verify + record it, then redirect to the app's deep
// link, which the WebView intercepts to close checkout.
import { withSentry } from '../_shared/sentry.ts';
import { readForm, settleFromPost } from '../_shared/payu.ts';

const APP_RETURN = 'vyaparhood://payment-result';

const back = (status: string, txnid: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: `${APP_RETURN}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}` },
  });

Deno.serve(withSentry('payu-return', async (req) => {
  if (req.method !== 'POST') return back('failed', '');
  const p = await readForm(req).catch(() => ({} as Record<string, string>));
  try {
    const { status, txnid } = await settleFromPost(p);
    return back(status, txnid);
  } catch (e) {
    console.error('payu-return failed', e);
    // The webhook or the app's re-check will still settle it.
    return back('pending', p.txnid ?? '');
  }
}));
