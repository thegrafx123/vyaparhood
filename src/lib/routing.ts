import { Me } from '../api/types';
import { Flags } from '../state/AppStore';

/**
 * Paywall rule. While billing is off (beta), the paywall is shown once so
 * the member can pick a plan; after that they go straight in.
 */
export function needsPaywall(me: Me): boolean {
  if (me.profile.is_admin) return false;
  if (me.billingEnabled) return !me.membership?.active;
  return !me.membership?.plan_id && !me.membership?.active;
}

/** Where a signed-in person belongs, based on how far they've got. */
export function routeForMe(me: Me | null, flags: Flags): string {
  if (!me) return '/welcome';
  if (me.profile.is_banned) return '/banned';
  if (me.profile.deletion_requested_at) return '/restore-account';
  if (!me.profile.consented_at) return '/auth/consent';
  if (!me.profile.city) return '/auth/city';
  if (!me.profile.onboarding_completed) return '/auth/profile';
  if (!flags.notificationsPrompted) return '/auth/notifications';
  if (needsPaywall(me)) return '/paywall';
  return '/discover';
}
