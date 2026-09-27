import { DEFAULT_OFFER } from './offer';
import { NO_ENTITLEMENT, PaymentProvider, PurchaseResult } from './types';

/**
 * Used until the payment gateway is chosen. It never grants access —
 * membership can only be switched on by the server (payments later,
 * an admin for now), so nobody can unlock the app from their phone.
 */
export const pendingProvider: PaymentProvider = {
  name: 'pending',
  async getOffer() {
    return DEFAULT_OFFER;
  },
  async purchase(): Promise<PurchaseResult> {
    return {
      status: 'error',
      message: "Payments aren't live yet. The Vyaparhood team can activate your membership in the meantime.",
    };
  },
  async restore() {
    return NO_ENTITLEMENT;
  },
  manageUrl() {
    return null;
  },
};
