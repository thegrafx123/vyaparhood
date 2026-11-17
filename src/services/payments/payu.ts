import { FunctionsHttpError } from '@supabase/supabase-js';
import { PlanId } from '../../api/types';
import { supabase } from '../../lib/supabase';
import { PaymentProvider, PlanOffer, PurchaseResult } from './types';

/**
 * PayU hosted checkout.
 *
 *  1. `payu-create-order` (Edge Function) prices the plan server-side and
 *     returns signed form fields.
 *  2. <PayUCheckout/> (mounted on the paywall) POSTs them to PayU in a
 *     WebView and resolves when PayU redirects to vyaparhood://payment-result.
 *  3. The server has already verified the payment with PayU and switched
 *     the membership on; the app only re-checks if the redirect was lost.
 */

export interface PayUOrder {
  txnid: string;
  action: string;
  fields: Record<string, string>;
}

export type CheckoutOutcome = { status: string; txnid: string } | { status: 'closed' };

type Presenter = (order: PayUOrder) => Promise<CheckoutOutcome>;
let presenter: Presenter | null = null;

/** Called by <PayUCheckout/> so purchase() can open it. */
export const registerCheckoutPresenter = (p: Presenter | null) => {
  presenter = p;
};

async function call<T>(body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke('payu-create-order', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const msg = await error.context.json().then((b: { error?: string }) => b.error).catch(() => null);
      if (msg) throw new Error(msg);
    }
    throw error;
  }
  return data as T;
}

const recheck = (txnid: string) => call<{ status: string }>({ checkTxnid: txnid }).then((r) => r.status);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toResult(status: string): PurchaseResult | null {
  switch (status) {
    case 'success':
      return { status: 'success' };
    case 'cancelled':
      return { status: 'cancelled' };
    case 'failed':
      return { status: 'error', message: 'Payment failed. No money was taken — or, if it was, it will be refunded automatically.' };
    case 'mismatch':
    case 'invalid':
      return { status: 'error', message: `Something went wrong verifying your payment. Please contact support.` };
    default:
      return null; // pending / unknown
  }
}

export function makePayUProvider(plans: PlanOffer[]): PaymentProvider {
  return {
    name: 'payu',
    async getPlans() {
      return plans;
    },
    async purchase(planId: PlanId): Promise<PurchaseResult> {
      if (!presenter) return { status: 'error', message: 'Checkout is not ready. Please try again.' };
      const order = await call<PayUOrder>({ planId });
      const outcome = await presenter(order);

      if (outcome.status !== 'closed') {
        const r = toResult(outcome.status);
        if (r) return r;
      }
      // Closed early or still pending: ask the server (which asks PayU) a few times.
      for (let i = 0; i < 4; i++) {
        const status = await recheck(order.txnid).catch(() => 'pending');
        if (status === 'created' || status === 'pending') {
          if (outcome.status === 'closed' && i === 0) {
            // Member backed out before paying: treat as cancelled unless PayU says otherwise.
            await sleep(1500);
            const again = await recheck(order.txnid).catch(() => 'pending');
            if (again === 'created' || again === 'pending') return { status: 'cancelled' };
            return toResult(again) ?? { status: 'cancelled' };
          }
          await sleep(2500);
          continue;
        }
        const r = toResult(status);
        if (r) return r;
      }
      return {
        status: 'error',
        message: "We're still confirming your payment with the bank. If money was deducted, your plan will switch on automatically within a few minutes.",
      };
    },
    manageUrl() {
      return null;
    },
  };
}
