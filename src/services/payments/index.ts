import { pendingProvider } from './pendingProvider';
import { PaymentProvider } from './types';

/**
 * The one line to change when payments go live, for example:
 *   Platform.OS === 'ios' ? appleProvider : cashfreeProvider
 * Each provider must confirm purchases through a Supabase Edge Function,
 * which is the only thing allowed to switch memberships.active on.
 */
export const payments: PaymentProvider = pendingProvider;

export * from './types';
export { DEFAULT_OFFER, rupees } from './offer';
