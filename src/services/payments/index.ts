import { makePayUProvider } from './payu';
import { PlanOffer, PaymentProvider } from './types';

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
 * PayU (see ./payu.ts). Only used while billing is on
 * (`update app_settings set billing_enabled = true;`); with billing off
 * the paywall keeps recording the chosen plan for free (beta).
 * Prices here are display only — the server charges from its own table.
 */
export const payments: PaymentProvider = makePayUProvider(PLANS);

export * from './types';
