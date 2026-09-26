/**
 * Payment abstraction.
 *
 * Screens never talk to a payment SDK directly. They call the active
 * `PaymentProvider` (see ./index.ts) and store the resulting `Entitlement`
 * in app state. To go live, write one provider per channel (Apple IAP,
 * Google Play Billing, Cashfree), have each one confirm the purchase with
 * YOUR backend, and return the entitlement the backend reports.
 * No screen code needs to change.
 */

export type BillingPeriod = 'week' | 'month' | 'year';

export interface PlanOffer {
  id: string;
  currency: 'INR';
  /** Introductory price, e.g. ₹99 for the first week. */
  introPrice: number;
  introPeriod: BillingPeriod;
  /** Regular recurring price, e.g. ₹500 per month. */
  price: number;
  period: BillingPeriod;
  /** Small line under the intro price card. */
  introNote: string;
}

export type EntitlementSource = 'none' | 'mock' | 'apple' | 'google' | 'cashfree';

export interface Entitlement {
  active: boolean;
  planId: string | null;
  source: EntitlementSource;
  /** ISO date the current period ends, if known. */
  renewsAt: string | null;
}

export type PurchaseResult =
  | { status: 'success'; entitlement: Entitlement }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface PaymentProvider {
  readonly name: string;
  getOffer(): Promise<PlanOffer>;
  purchase(offerId: string): Promise<PurchaseResult>;
  restore(): Promise<Entitlement>;
  /** Where "Manage membership" should send the user, if anywhere. */
  manageUrl(): string | null;
}

export const NO_ENTITLEMENT: Entitlement = {
  active: false,
  planId: null,
  source: 'none',
  renewsAt: null,
};
