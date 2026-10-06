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
  if (/token has expired|invalid otp|otp_expired|invalid token/i.test(msg)) {
    return 'That code is wrong or has expired. Request a new one.';
  }
  if (/sms|phone provider|unsupported phone provider|twilio/i.test(msg)) {
    return "We couldn't send the SMS right now. Please try again in a minute.";
  }
  if (/invalid phone|phone.*invalid/i.test(msg)) {
    return 'Enter a valid 10-digit mobile number.';
  }
  if (/rate limit|too many|security purposes/i.test(msg)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (/payload too large|exceeded the maximum allowed size/i.test(msg)) {
    return 'That photo is too large. Try a different one.';
  }
  // Messages raised by our own database functions are already readable.
  if (msg && msg.length < 140 && !/violates|syntax|relation|column|function|permission denied/i.test(msg)) return msg;
  return 'Something went wrong. Please try again.';
}
