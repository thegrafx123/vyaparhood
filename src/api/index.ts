import { COUNTRY_CODE } from '../config';
import { supabase } from '../lib/supabase';
import {
  AdminMember,
  AdminReport,
  BlockedRow,
  BusinessLocation,
  ChatRow,
  DiscoverParams,
  DiscoveryContext,
  Me,
  MemberCardData,
  MemberDetail,
  Message,
  MyRating,
  NotificationRow,
  PlanId,
  ProfileUpdate,
  ReportReason,
  RequestRow,
  SavedRow,
  Stats,
} from './types';

/**
 * Every call to the backend lives in this file. Screens use the hooks in
 * ./hooks.ts, which wrap these functions with caching and refresh.
 */

function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

async function myId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

/** "98765 43210" → "+919876543210" */
export const toE164 = (tenDigits: string) => `+${COUNTRY_CODE}${tenDigits.replace(/\D/g, '')}`;

/* ------------------------------------------------------------------ */
/* Auth — phone OTP                                                    */
/* ------------------------------------------------------------------ */

export const auth = {
  async sendCode(tenDigits: string) {
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(tenDigits),
      options: { shouldCreateUser: true, channel: 'sms' },
    });
    if (error) throw error;
  },
  async verifyCode(tenDigits: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ phone: toE164(tenDigits), token, type: 'sms' });
    if (error) throw error;
    return data.session;
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};

/* ------------------------------------------------------------------ */
/* My account                                                          */
/* ------------------------------------------------------------------ */

export const PHOTO_BUCKET = 'avatars';
/** The one photo a member may have. The database only allows this path. */
export const photoPathFor = (uid: string) => `${uid}/avatar.jpg`;

export const me = {
  async fetch(): Promise<Me> {
    const uid = await myId();
    const [profile, membership, business, settings] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('memberships').select('active, plan_id, source, renews_at').eq('user_id', uid).maybeSingle(),
      supabase
        .from('business_locations')
        .select('address_line, locality, pincode, city, placed_by')
        .eq('user_id', uid)
        .maybeSingle(),
      supabase.from('app_settings').select('billing_enabled').maybeSingle(),
    ]);
    return {
      profile: must(profile),
      membership: must(membership),
      business: must(business) as BusinessLocation | null,
      billingEnabled: !!(must(settings) as { billing_enabled: boolean } | null)?.billing_enabled,
    };
  },

  async update(patch: ProfileUpdate) {
    const uid = await myId();
    must(await supabase.from('profiles').update(patch).eq('id', uid).select('id').single());
  },

  /** Uploads (or replaces) the member's single photo and returns its path. */
  async uploadPhoto(jpeg: ArrayBuffer) {
    const uid = await myId();
    const path = photoPathFor(uid);
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true, cacheControl: '300' });
    if (error) throw error;
    return path;
  },

  async stats(): Promise<Stats> {
    const rows = must(await supabase.rpc('my_stats'));
    return (rows as Stats[])[0] ?? { connections: 0, requests_sent: 0, rating: null };
  },

  /** Records the plan picked on the paywall while billing is off (beta). */
  async choosePlan(plan: PlanId) {
    must(await supabase.rpc('choose_plan', { p_plan: plan }));
  },

  /** Hides the account now; returns the date it will be deleted for good. */
  async requestDeletion(): Promise<string> {
    return must(await supabase.rpc('request_account_deletion')) as string;
  },

  async cancelDeletion() {
    must(await supabase.rpc('cancel_account_deletion'));
  },
};

/* ------------------------------------------------------------------ */
/* Locations — coordinates go to the server, never to other members    */
/* ------------------------------------------------------------------ */

export const location = {
  /** Where the phone is now. Only used as the start of MY Nearby search. */
  async updateLive(p: { lat: number; lng: number; city: string | null; locality: string | null }) {
    must(
      await supabase.rpc('update_live_location', {
        p_lat: p.lat,
        p_lng: p.lng,
        p_city: p.city,
        p_locality: p.locality,
      }),
    );
  },

  /** The business address others find me by. Returns how it was placed on the map. */
  async setBusiness(p: {
    addressLine: string;
    locality: string;
    pincode: string;
    city: string;
    lat: number | null;
    lng: number | null;
  }): Promise<'device' | 'pincode' | 'none'> {
    return must(
      await supabase.rpc('set_business_location', {
        p_address_line: p.addressLine,
        p_locality: p.locality,
        p_pincode: p.pincode || null,
        p_city: p.city,
        p_lat: p.lat,
        p_lng: p.lng,
      }),
    ) as 'device' | 'pincode' | 'none';
  },

  async context(): Promise<DiscoveryContext> {
    const rows = must(await supabase.rpc('my_discovery_context')) as DiscoveryContext[];
    return rows[0] ?? { origin: 'none', live_city: null, business_city: null, has_business_point: false };
  },
};

/* ------------------------------------------------------------------ */
/* Discovery                                                           */
/* ------------------------------------------------------------------ */

export const discover = {
  async list(p: DiscoverParams): Promise<MemberCardData[]> {
    return must(
      await supabase.rpc('discover_members', {
        p_mode: p.mode,
        p_city: p.city,
        p_max_km: p.maxKm,
        p_categories: p.categories.length ? p.categories : null,
        p_verified_only: p.verifiedOnly,
        p_sort: p.sort,
        p_limit: 100,
        p_offset: 0,
      }),
    ) as MemberCardData[];
  },
  async member(id: string): Promise<MemberDetail | null> {
    const rows = must(await supabase.rpc('get_member', { p_id: id })) as MemberDetail[];
    return rows[0] ?? null;
  },
};

/* ------------------------------------------------------------------ */
/* Requests & chat                                                     */
/* ------------------------------------------------------------------ */

export const requests = {
  async list(): Promise<RequestRow[]> {
    return must(await supabase.rpc('my_requests')) as RequestRow[];
  },
  async send(memberId: string, note: string) {
    return must(await supabase.rpc('send_connection_request', { p_to: memberId, p_note: note })) as string;
  },
  async respond(requestId: string, accept: boolean) {
    return must(
      await supabase.rpc('respond_connection_request', { p_request: requestId, p_accept: accept }),
    ) as string | null;
  },
  async withdraw(requestId: string) {
    must(await supabase.rpc('withdraw_connection_request', { p_request: requestId }));
  },
};

export const chat = {
  async list(): Promise<ChatRow[]> {
    return must(await supabase.rpc('my_chats')) as ChatRow[];
  },
  async messages(connectionId: string): Promise<Message[]> {
    const rows = must(
      await supabase
        .from('messages')
        .select('id, connection_id, sender_id, body, created_at')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(200),
    ) as Message[];
    return rows.reverse();
  },
  async send(connectionId: string, body: string): Promise<Message> {
    const uid = await myId();
    return must(
      await supabase
        .from('messages')
        .insert({ connection_id: connectionId, sender_id: uid, body })
        .select('id, connection_id, sender_id, body, created_at')
        .single(),
    ) as Message;
  },
  async markRead(connectionId: string) {
    must(await supabase.rpc('mark_chat_read', { p_connection: connectionId }));
  },
};

/* ------------------------------------------------------------------ */
/* Safety, saved, ratings, notifications                               */
/* ------------------------------------------------------------------ */

export const safety = {
  async block(memberId: string) {
    must(await supabase.rpc('block_member', { p_id: memberId }));
  },
  async unblock(memberId: string) {
    const uid = await myId();
    must(await supabase.from('blocks').delete().eq('blocker', uid).eq('blocked', memberId));
  },
  async blocked(): Promise<BlockedRow[]> {
    return must(await supabase.rpc('my_blocked')) as BlockedRow[];
  },
  async report(memberId: string, reason: ReportReason, details: string) {
    const uid = await myId();
    must(await supabase.from('reports').insert({ reporter: uid, reported: memberId, reason, details }));
  },
  async myRating(memberId: string): Promise<MyRating | null> {
    const uid = await myId();
    return must(
      await supabase.from('ratings').select('stars, tags, note').eq('rater', uid).eq('rated', memberId).maybeSingle(),
    ) as MyRating | null;
  },
  async rate(memberId: string, r: MyRating) {
    must(await supabase.rpc('rate_member', { p_id: memberId, p_stars: r.stars, p_tags: r.tags, p_note: r.note }));
  },
};

export const saved = {
  async list(): Promise<SavedRow[]> {
    return must(await supabase.rpc('my_saved')) as SavedRow[];
  },
  async set(memberId: string, save: boolean) {
    const uid = await myId();
    if (save) {
      must(
        await supabase
          .from('saved_profiles')
          .upsert({ user_id: uid, member_id: memberId }, { onConflict: 'user_id,member_id', ignoreDuplicates: true }),
      );
    } else {
      must(await supabase.from('saved_profiles').delete().eq('user_id', uid).eq('member_id', memberId));
    }
  },
};

export const notifications = {
  async list(): Promise<NotificationRow[]> {
    return must(await supabase.rpc('my_notifications')) as NotificationRow[];
  },
  async markAllRead(ids: number[]) {
    if (!ids.length) return;
    must(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids));
  },
};

/* ------------------------------------------------------------------ */
/* Signed photo links                                                  */
/* ------------------------------------------------------------------ */

export async function signedUrl(path: string, seconds = 3600) {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const admin = {
  async reports(): Promise<AdminReport[]> {
    return must(await supabase.rpc('admin_list_reports')) as AdminReport[];
  },
  async setReportStatus(reportId: string, status: 'open' | 'actioned' | 'dismissed') {
    must(await supabase.rpc('admin_set_report_status', { p_report: reportId, p_status: status }));
  },
  async setBanned(userId: string, banned: boolean) {
    must(await supabase.rpc('admin_set_banned', { p_user: userId, p_banned: banned }));
  },
  async members(query: string): Promise<AdminMember[]> {
    return must(await supabase.rpc('admin_search_members', { p_query: query })) as AdminMember[];
  },
  async setMembership(userId: string, active: boolean) {
    must(await supabase.rpc('admin_set_membership', { p_user: userId, p_active: active }));
  },
  async setAdmin(userId: string, isAdmin: boolean) {
    must(await supabase.rpc('admin_set_admin', { p_user: userId, p_admin: isAdmin }));
  },
  async setBilling(enabled: boolean) {
    must(await supabase.rpc('admin_set_billing', { p_enabled: enabled }));
  },
};
