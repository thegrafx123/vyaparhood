import { PlanId } from '../../api/types';

/**
 * Payment abstraction.
 *
 * Screens never talk to a payment SDK directly. They call the active
 * `PaymentProvider` (see ./index.ts). To go live, write one provider per
 * channel (Apple IAP, Google Play Billing, Cashfree/Razorpay), have each
 * one confirm the purchase with a Supabase Edge Function (the only thing
 * allowed to switch memberships.active on), then turn billing on with
 * `update app_settings set billing_enabled = true;`.
 */

export type BillingPeriod = 'week' | 'month';

export interface PlanOffer {
  id: PlanId;
  currency: 'INR';
  price: number;
  period: BillingPeriod;
  title: string;
  /** Small line under the price. */
  note: string;
  /** Highlight badge, e.g. "EARLY BIRD". */
  badge?: string;
  highlighted?: boolean;
}

export type PurchaseResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface PaymentProvider {
  readonly name: string;
  getPlans(): Promise<PlanOffer[]>;
  purchase(planId: PlanId): Promise<PurchaseResult>;
  /** Where "Manage membership" should send the user, if anywhere. */
  manageUrl(): string | null;
}
