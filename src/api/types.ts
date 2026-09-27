import { CategoryId } from '../config';

export type TagTone = 'orange' | 'yellow' | 'blue' | 'teal';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  dob: string | null;
  headline: string;
  building: string;
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
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'full_name' | 'phone' | 'dob' | 'building' | 'headline' | 'category' | 'bio' | 'social_handle'
    | 'offers' | 'looking_for' | 'city' | 'area' | 'photo_path' | 'show_exact_distance'
    | 'notify_requests' | 'notify_messages' | 'onboarding_completed' | 'consented_at'
  >
>;

export interface Membership {
  active: boolean;
  plan_id: string | null;
  source: 'none' | 'admin' | 'apple' | 'google' | 'cashfree';
  renews_at: string | null;
}

export interface SavedLocation {
  source: 'device' | 'manual';
  pincode: string | null;
  locality: string | null;
  city: string | null;
}

export interface Me {
  profile: Profile;
  membership: Membership | null;
  location: SavedLocation | null;
}

export const isActiveMember = (me: Me | null | undefined) =>
  !!me && !me.profile.is_banned && (me.profile.is_admin || !!me.membership?.active);

/** Anything the UI can draw a distance / radar pin for. */
export interface DistanceLike {
  id: string;
  full_name: string;
  distance_km: number | null;
  distance_precise: boolean;
}

export interface MemberCardData extends DistanceLike {
  headline: string;
  category: CategoryId | null;
  area: string | null;
  city: string | null;
  verified: boolean;
  tag_label: string | null;
  tag_tone: TagTone | null;
  photo_path: string | null;
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
  photo_path: string | null;
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
  member_photo: string | null;
  last_body: string | null;
  last_sender_is_me: boolean | null;
  last_at: string;
  unread: boolean;
  blocked: boolean;
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
}

export interface Stats {
  connections: number;
  requests_sent: number;
  rating: number | null;
}

export interface VerificationDoc {
  id: string;
  kind: 'business_proof' | 'gov_id';
  storage_path: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  delete_after: string;
}

export interface MyRating {
  stars: number;
  tags: string[];
  note: string;
}

export type ReportReason = 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'other';

export interface DiscoverParams {
  mode: 'nearby' | 'citywide';
  maxKm: number;
  categories: CategoryId[];
  verifiedOnly: boolean;
  sort: 'default' | 'nearest' | 'newest' | 'rating';
}

/* ---- admin ---- */

export interface AdminDoc {
  doc_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  kind: 'business_proof' | 'gov_id';
  file_name: string;
  storage_path: string;
  created_at: string;
}

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
  email: string | null;
  city: string | null;
  verification_status: VerificationStatus;
  membership_active: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}
