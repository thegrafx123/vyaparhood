import { mockProvider } from "./mockProvider";
import { PaymentProvider } from "./types";

/**
 * The one line to change when payments go live, for example:
 *   Platform.OS === "ios" ? appleProvider : cashfreeOrPlayProvider
 */
export const payments: PaymentProvider = mockProvider;

export * from "./types";
export { DEFAULT_OFFER, rupees } from "./offer";
