export const digitsOnly = (v: string) => v.replace(/\D/g, '');

/** Indian mobile numbers: 10 digits starting 6–9. */
export const isValidPhone = (v: string) => /^[6-9]\d{9}$/.test(digitsOnly(v));

/** "9876543210" -> "98765 43210" */
export const formatPhone = (v: string) => {
  const d = digitsOnly(v).slice(0, 10);
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
};

export const isValidPincode = (v: string) => /^[1-9]\d{5}$/.test(v.trim());

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Formats typed digits as "DD / MM / YYYY". */
export const formatDob = (v: string) => {
  const d = digitsOnly(v).slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join(' / ');
};

export type DobCheck = { ok: true; age: number } | { ok: false; reason: string };

export function checkDob(v: string, minAge = 18): DobCheck {
  const d = digitsOnly(v);
  if (d.length !== 8) return { ok: false, reason: 'Enter your date of birth as DD / MM / YYYY.' };
  const day = Number(d.slice(0, 2));
  const month = Number(d.slice(2, 4));
  const year = Number(d.slice(4, 8));
  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!real) return { ok: false, reason: "That date doesn't exist. Check the day and month." };

  const now = new Date();
  let age = now.getFullYear() - year;
  const hadBirthday =
    now.getMonth() > month - 1 || (now.getMonth() === month - 1 && now.getDate() >= day);
  if (!hadBirthday) age -= 1;
  if (age < minAge) return { ok: false, reason: `You must be ${minAge} or older to join.` };
  if (age > 110) return { ok: false, reason: 'Check the year of birth.' };
  return { ok: true, age };
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export const nowTime = () => {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};
