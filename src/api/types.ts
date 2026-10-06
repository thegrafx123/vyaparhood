import { CategoryId } from '../config';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string;
  dob: string | null;
  headline: string;
  category: CategoryId | null;
  bio: string;
  social_handle: string | null;
  offers: string[];
  looking_for: string[];
  city: string | null;
  area: string | null;
  photo_path: string | null;
  verification_status: VerificationStatus;
  show_exact_distance: boolean;
  notify_requests: boolean;
  notify_messages: boolean;
  onboarding_completed: boolean;
  consented_at: string | null;
  deletion_requested_at: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'full_name' | 'email' | 'dob' | 'headline' | 'category' | 'bio' | 'social_handle'
    | 'offers' | 'looking_for' | 'city' | 'area' | 'photo_path' | 'show_exact_distance'
    | 'notify_requests' | 'notify_messages' | 'onboarding_completed' | 'consented_at'
  >
>;

export type PlanId = 'weekly_99' | 'monthly_299';

export interface Membership {
  active: boolean;
  plan_id: PlanId | 'granted' | 'root' | null;
  source: 'none' | 'beta' | 'admin' | 'apple' | 'google' | 'cashfree';
  renews_at: string | null;
}

/** The member's own business address (never shown to others). */
export interface BusinessLocation {
  address_line: string;
  locality: string | null;
  pincode: string | null;
  city: string | null;
  placed_by: 'device' | 'pincode' | 'none';
}

export interface Me {
  profile: Profile;
  membership: Membership | null;
  business: BusinessLocation | null;
  billingEnabled: boolean;
}

/** Can use the app (discover, requests, chat). Mirrors is_active_member() in SQL. */
export const isActiveMember = (me: Me | null | undefined) =>
  !!me &&
  !me.profile.is_banned &&
  !me.profile.deletion_requested_at &&
  me.profile.onboarding_completed &&
  (me.profile.is_admin || !me.billingEnabled || !!me.membership?.active);

/** Anything the UI can draw a distance / radar pin for. */
export interface DistanceLike {
  id: string;
  full_name: string;
  photo_path: string | null;
  distance_km: number | null;
  distance_precise: boolean;
}

export interface MemberCardData extends DistanceLike {
  headline: string;
  category: CategoryId | null;
  area: string | null;
  city: string | null;
  verified: boolean;
  offers: string[];
  looking_for: string[];
  joined_at: string;
  rating: number | null;
}

export type Relation = 'none' | 'outgoing' | 'incoming' | 'connected' | 'blocked';

export interface MemberDetail extends DistanceLike {
  headline: string;
  bio: string;
  category: CategoryId | null;
  area: string | null;
  city: string | null;
  verified: boolean;
  social_handle: string | null;
  connections: number;
  member_since: string;
  rating: number | null;
  offers: string[];
  looking_for: string[];
  relation: Relation;
  request_id: string | null;
  connection_id: string | null;
  is_saved: boolean;
}

export interface DiscoveryContext {
  origin: 'live' | 'business' | 'none';
  live_city: string | null;
  business_city: string | null;
  has_business_point: boolean;
}

export interface RequestRow {
  id: string;
  direction: 'incoming' | 'outgoing';
  note: string;
  created_at: string;
  member_id: string;
  member_name: string;
  member_headline: string;
  member_photo: string | null;
}

export interface ChatRow {
  connection_id: string;
  member_id: string;
  member_name: string;
  member_headline: string;
  member_photo: string | null;
  last_body: string | null;
  last_sender_is_me: boolean | null;
  last_at: string;
  unread: boolean;
  /** false once they block you, get banned or delete their account. */
  available: boolean;
}

export interface Message {
  id: number;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export type NotificationKind = 'request' | 'approved' | 'badge' | 'message';

export interface NotificationRow {
  id: number;
  kind: NotificationKind;
  created_at: string;
  read_at: string | null;
  actor_id: string | null;
  actor_name: string | null;
  connection_id: string | null;
}

export interface SavedRow {
  id: string;
  full_name: string;
  headline: string;
  photo_path: string | null;
  verified: boolean;
}

export interface BlockedRow {
  id: string;
  full_name: string;
  headline: string;
  photo_path: string | null;
}

export interface Stats {
  connections: number;
  requests_sent: number;
  rating: number | null;
}

export interface MyRating {
  stars: number;
  tags: string[];
  note: string;
}

export type ReportReason = 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'other';

export type SortBy = 'default' | 'nearest' | 'newest' | 'rating';

export interface DiscoverParams {
  mode: 'nearby' | 'citywide';
  city: string | null;
  maxKm: number;
  categories: CategoryId[];
  verifiedOnly: boolean;
  sort: SortBy;
}

/* ---- admin ---- */

export interface AdminReport {
  id: string;
  reporter_name: string;
  reported_id: string;
  reported_name: string;
  reported_banned: boolean;
  reason: ReportReason;
  details: string;
  status: 'open' | 'actioned' | 'dismissed';
  created_at: string;
}

export interface AdminMember {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  membership_active: boolean;
  is_admin: boolean;
  is_banned: boolean;
  deleting: boolean;
  created_at: string;
}
