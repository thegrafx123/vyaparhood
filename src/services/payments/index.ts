import { PlanOffer, PaymentProvider, PurchaseResult } from './types';

/** Single source of truth for the prices shown on the paywall. */
export const PLANS: PlanOffer[] = [
  {
    id: 'monthly_299',
    currency: 'INR',
    price: 299,
    period: 'month',
    title: 'Monthly',
    note: 'Early-bird price for our first members',
    badge: 'EARLY BIRD',
    highlighted: true,
  },
  {
    id: 'weekly_99',
    currency: 'INR',
    price: 99,
    period: 'week',
    title: '1 Week',
    note: 'Try it out for a week',
  },
];

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/**
 * Used until a payment gateway is added. It never grants access on its
 * own: with billing off the paywall records the chosen plan (free beta);
 * with billing on, it refuses so nobody can unlock the app from a phone.
 */
const notLiveProvider: PaymentProvider = {
  name: 'not-live',
  async getPlans() {
    return PLANS;
  },
  async purchase(): Promise<PurchaseResult> {
    return { status: 'error', message: "Payments aren't live yet. Please try again soon." };
  },
  manageUrl() {
    return null;
  },
};

/** The one line to change when payments go live. */
export const payments: PaymentProvider = notLiveProvider;

export * from './types';
