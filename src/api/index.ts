import { supabase } from '../lib/supabase';
import { extensionFor, readFileBytes, uploadToBucket } from '../lib/files';
import {
  AdminDoc,
  AdminMember,
  AdminReport,
  ChatRow,
  DiscoverParams,
  Me,
  MemberCardData,
  MemberDetail,
  Message,
  MyRating,
  NotificationRow,
  ProfileUpdate,
  ReportReason,
  RequestRow,
  SavedRow,
  Stats,
  VerificationDoc,
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

/* ------------------------------------------------------------------ */
/* Auth — email OTP                                                    */
/* ------------------------------------------------------------------ */

export const auth = {
  async sendEmailCode(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },
  async verifyEmailCode(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    if (error) throw error;
    return data.session;
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async deleteAccount() {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) throw error;
    await supabase.auth.signOut();
  },
};

/* ------------------------------------------------------------------ */
/* My profile                                                          */
/* ------------------------------------------------------------------ */

export const me = {
  async fetch(): Promise<Me> {
    const uid = await myId();
    const [profile, membership, location] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('memberships').select('active, plan_id, source, renews_at').eq('user_id', uid).maybeSingle(),
      supabase.from('user_locations').select('source, pincode, locality, city').eq('user_id', uid).maybeSingle(),
    ]);
    return {
      profile: must(profile),
      membership: must(membership),
      location: must(location),
    };
  },

  async update(patch: ProfileUpdate) {
    const uid = await myId();
    must(await supabase.from('profiles').update(patch).eq('id', uid).select('id').single());
  },

  /** Uploads a new profile photo (bytes already read) and returns its storage path. */
  async uploadPhoto(data: ArrayBuffer, mime = 'image/jpeg') {
    const uid = await myId();
    const path = `${uid}/avatar-${Date.now()}.${extensionFor(mime)}`;
    await uploadToBucket('avatars', path, data, mime);
    return path;
  },

  async removeOldPhoto(path: string | null) {
    if (path) await supabase.storage.from('avatars').remove([path]);
  },

  async stats(): Promise<Stats> {
    const rows = must(await supabase.rpc('my_stats'));
    return (rows as Stats[])[0] ?? { connections: 0, requests_sent: 0, rating: null };
  },
};

/* ------------------------------------------------------------------ */
/* Location — coordinates go to the server, never to other members     */
/* ------------------------------------------------------------------ */

export const location = {
  async saveDevice(p: { lat: number; lng: number; geohash: string | null; area: string | null; city: string | null }) {
    must(
      await supabase.rpc('update_my_location', {
        p_lat: p.lat,
        p_lng: p.lng,
        p_geohash: p.geohash,
        p_source: 'device',
        p_locality: p.area,
        p_city: p.city,
      }),
    );
  },
  async saveManual(p: { pincode: string; locality: string; city: string; line: string }) {
    must(
      await supabase.rpc('update_my_location', {
        p_source: 'manual',
        p_pincode: p.pincode,
        p_locality: p.locality,
        p_city: p.city,
        p_address_line: p.line || null,
      }),
    );
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
  async blocked(): Promise<{ id: string; full_name: string }[]> {
    return must(await supabase.rpc('my_blocked')) as { id: string; full_name: string }[];
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
  async markRead(id: number) {
    must(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id));
  },
};

/* ------------------------------------------------------------------ */
/* Verification documents (private bucket, deleted after 30 days)      */
/* ------------------------------------------------------------------ */

export const documents = {
  async list(): Promise<VerificationDoc[]> {
    return must(
      await supabase
        .from('verification_documents')
        .select('id, kind, storage_path, file_name, status, created_at, delete_after')
        .is('purged_at', null)
        .order('created_at', { ascending: false }),
    ) as VerificationDoc[];
  },
  async upload(kind: 'business_proof' | 'gov_id', file: { uri: string; name: string; mimeType: string | null; size: number | null }) {
    const uid = await myId();
    const mime = file.mimeType ?? 'application/octet-stream';
    const path = `${uid}/${kind}-${Date.now()}.${extensionFor(mime, file.name)}`;
    const bytes = await readFileBytes(file.uri);
    await uploadToBucket('verification-docs', path, bytes, mime);
    must(
      await supabase.from('verification_documents').insert({
        user_id: uid,
        kind,
        storage_path: path,
        file_name: file.name.slice(0, 200),
        mime_type: mime,
        size_bytes: file.size ?? bytes.byteLength,
      }),
    );
  },
  async remove(doc: VerificationDoc) {
    await supabase.storage.from('verification-docs').remove([doc.storage_path]);
    must(await supabase.from('verification_documents').delete().eq('id', doc.id));
  },
};

/* ------------------------------------------------------------------ */
/* Signed photo / document links                                       */
/* ------------------------------------------------------------------ */

export async function signedUrl(bucket: 'avatars' | 'verification-docs', path: string, seconds = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const admin = {
  async pendingDocs(): Promise<AdminDoc[]> {
    return must(await supabase.rpc('admin_pending_documents')) as AdminDoc[];
  },
  async review(userId: string, approve: boolean) {
    must(await supabase.rpc('admin_review_member', { p_user: userId, p_approve: approve }));
  },
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
};
