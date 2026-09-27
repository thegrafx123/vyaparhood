/** Turns Supabase / network errors into sentences a member can act on. */
export function friendlyError(e: unknown): string {
  const anyE = e as { message?: string; code?: string; status?: number } | null;
  const msg = anyE?.message ?? '';
  if (/network request failed|failed to fetch|timeout/i.test(msg)) {
    return 'Check your internet connection and try again.';
  }
  if (anyE?.code === '42501' || /membership required/i.test(msg)) {
    return 'This needs an active membership.';
  }
  if (/token has expired|invalid otp|otp_expired/i.test(msg)) {
    return 'That code is wrong or has expired. Request a new one.';
  }
  if (/rate limit|too many/i.test(msg)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  // Messages raised by our own database functions are already readable.
  if (msg && msg.length < 140 && !/violates|syntax|relation|column|function/i.test(msg)) return msg;
  return 'Something went wrong. Please try again.';
}
