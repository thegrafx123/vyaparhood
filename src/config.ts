/**
 * Central switches for the prototype. Change behaviour here rather than
 * inside screens.
 */

/** Cities where Vyaparhood is live. Shows the "<City> · Live now" welcome variant. */
export const LIVE_CITIES = ['Surat', 'Mumbai'];

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
];

export type CategoryId = 'food' | 'fitness' | 'creative' | 'tech' | 'retail';

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: 'food', label: 'Food & Hospitality', short: 'Food & Hospitality' },
  { id: 'fitness', label: 'Fitness & Wellness', short: 'Fitness' },
  { id: 'creative', label: 'Creative & Design', short: 'Creative' },
  { id: 'tech', label: 'Tech & Startups', short: 'Tech' },
  { id: 'retail', label: 'Retail', short: 'Retail' },
];

export const categoryLabel = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** OTP length shown in the verify screen. The design uses 4; 6 is safer once the backend exists. */
/** Email OTP length. Must match Supabase → Auth → Email OTP length (default 6). */
export const OTP_LENGTH = 6;
/** Supabase allows one code per email every 60 seconds by default. */
export const OTP_RESEND_SECONDS = 60;


/** Verification documents. Flip to true when business proof becomes mandatory. */
export const REQUIRE_BUSINESS_PROOF = false;
export const DOCUMENT_RETENTION_DAYS = 30;
export const MAX_DOCUMENT_MB = 10;
export const MASKED_AADHAAR_URL = 'https://myaadhaar.uidai.gov.in';

/** Discover defaults. */
export const DISTANCE_MIN_KM = 0.5;
export const DISTANCE_MAX_KM = 20;
export const DEFAULT_DISTANCE_KM = 4.5;

export const SUPPORT_EMAIL = 'support@vyaparhood.com';
