/**
 * Central switches. Change behaviour here rather than inside screens.
 */

export const POPULAR_CITIES = [
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Ahmedabad',
  'Jaipur',
  'Kolkata',
  'Kochi',
];

/** Used by "Search your city". Extend freely. */
export const ALL_CITIES = [
  ...POPULAR_CITIES,
  'Surat',
  'Vadodara',
  'Rajkot',
  'Indore',
  'Bhopal',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Nashik',
  'Chandigarh',
  'Coimbatore',
  'Madurai',
  'Mysuru',
  'Mangaluru',
  'Visakhapatnam',
  'Vijayawada',
  'Thiruvananthapuram',
  'Bhubaneswar',
  'Patna',
  'Guwahati',
  'Dehradun',
  'Goa',
  'Noida',
  'Gurugram',
  'Thane',
  'Navi Mumbai',
];

export type CategoryId = 'food' | 'fitness' | 'creative' | 'tech' | 'retail';

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: 'food', label: 'Food & Hospitality', short: 'Food & Hospitality' },
  { id: 'fitness', label: 'Fitness & Wellness', short: 'Fitness' },
  { id: 'creative', label: 'Creative & Design', short: 'Creative' },
  { id: 'tech', label: 'Tech & Startups', short: 'Tech' },
  { id: 'retail', label: 'Retail', short: 'Retail' },
];

export const categoryLabel = (id: CategoryId | null | undefined) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? '';

/** Phone login. Must match Supabase → Auth → Phone → OTP length. */
export const OTP_LENGTH = 6;
/** Supabase allows one SMS per number every 60 seconds by default. */
export const OTP_RESEND_SECONDS = 60;
export const COUNTRY_CODE = '91';

/** Account deletion grace period. Must match the purge Edge Function. */
export const DELETE_AFTER_DAYS = 30;

/** Discover defaults. */
export const DISTANCE_MIN_KM = 0.5;
export const DISTANCE_MAX_KM = 20;
export const DEFAULT_DISTANCE_KM = 4.5;

/** Profile photo: one per member, resized before upload. */
export const PHOTO_SIZE_PX = 720;
export const PHOTO_JPEG_QUALITY = 0.7;

export const SUPPORT_EMAIL = 'support@vyaparhood.com';
export const PRIVACY_EMAIL = 'privacy@vyaparhood.com';
