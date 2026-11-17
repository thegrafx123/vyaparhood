import { hasLiveMembership, Me } from '../api/types';
import { Flags } from '../state/AppStore';

/**
 * Paywall rule: everyone except admins needs an active membership that
 * hasn't passed its end date. In beta, picking a plan on the paywall is
 * free and starts a 7- or 30-day membership.
 */
export function needsPaywall(me: Me): boolean {
  if (me.profile.is_admin) return false;
  return !hasLiveMembership(me);
}

/** Where a signed-in person belongs, based on how far they've got. */
export function routeForMe(me: Me | null, flags: Flags): string {
  if (!me) return '/welcome';
  if (me.profile.is_banned) return '/banned';
  if (me.profile.deletion_requested_at) return '/restore-account';
  // Asked once, while signing up for the first time.
  if (!me.profile.onboarding_completed && !me.profile.phone) return '/auth/phone';
  if (!me.profile.consented_at) return '/auth/consent';
  if (!me.profile.city) return '/auth/city';
  if (!me.profile.onboarding_completed) return '/auth/profile';
  if (!flags.notificationsPrompted) return '/auth/notifications';
  if (needsPaywall(me)) return '/paywall';
  return '/discover';
}

type Nav = { canDismiss: () => boolean; dismissAll: () => void; replace: (href: never) => void };

/**
 * Clears the back history, then opens `href`. Used when someone signs in,
 * finishes signup or logs out, so the back button can't return to the
 * welcome/onboarding pages while signed in (or into the app after logging out).
 */
export function resetTo(router: Nav, href: string) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href as never);
}
