import { isActiveMember, Me } from '../api/types';

/** Where a signed-in person belongs, based on how far they've got. */
export function routeForMe(me: Me | null): string {
  if (!me) return '/welcome';
  if (me.profile.is_banned) return '/banned';
  if (!me.profile.consented_at) return '/auth/consent';
  if (!me.profile.onboarding_completed) return '/auth/city';
  if (!isActiveMember(me)) return '/paywall';
  return '/discover';
}
