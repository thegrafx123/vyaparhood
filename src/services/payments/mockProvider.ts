import { DEFAULT_OFFER } from "./offer";
import { Entitlement, PaymentProvider, PurchaseResult } from "./types";

/**
 * Prototype-only provider: unlocks membership instantly and charges nothing.
 * Replace with a real provider before release.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockProvider: PaymentProvider = {
  name: "mock",
  async getOffer() {
    return DEFAULT_OFFER;
  },
  async purchase(offerId: string): Promise<PurchaseResult> {
    await wait(900);
    const renews = new Date();
    renews.setDate(renews.getDate() + 7);
    const entitlement: Entitlement = {
      active: true,
      planId: offerId,
      source: "mock",
      renewsAt: renews.toISOString(),
    };
    return { status: "success", entitlement };
  },
  async restore() {
    return { active: false, planId: null, source: "none", renewsAt: null };
  },
  manageUrl() {
    return null;
  },
};
