import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../state/AuthProvider';
import * as api from './index';
import { DiscoverParams, isActiveMember, Message, MyRating, ReportReason } from './types';

/**
 * React Query wrappers. Query keys are the "cache addresses";
 * mutations invalidate the keys whose data they change.
 */
export const keys = {
  discover: (p: DiscoverParams) => ['discover', p] as const,
  context: ['discoveryContext'] as const,
  member: (id: string) => ['member', id] as const,
  requests: ['requests'] as const,
  chats: ['chats'] as const,
  messages: (cid: string) => ['messages', cid] as const,
  notifications: ['notifications'] as const,
  saved: ['saved'] as const,
  blocked: ['blocked'] as const,
  stats: ['stats'] as const,
  myRating: (id: string) => ['myRating', id] as const,
  signed: (path: string) => ['signed', path] as const,
  admin: (part: string, q = '') => ['admin', part, q] as const,
};

function useMemberGate() {
  const { me } = useAuth();
  return isActiveMember(me);
}

export function useDiscover(p: DiscoverParams, enabled = true) {
  const member = useMemberGate();
  return useQuery({ queryKey: keys.discover(p), queryFn: () => api.discover.list(p), enabled: member && enabled });
}

export function useDiscoveryContext() {
  const member = useMemberGate();
  return useQuery({ queryKey: keys.context, queryFn: api.location.context, enabled: member });
}

export function useMember(id: string | undefined) {
  const member = useMemberGate();
  return useQuery({ queryKey: keys.member(id ?? ''), queryFn: () => api.discover.member(id!), enabled: member && !!id });
}

export function useRequests() {
  const member = useMemberGate();
  return useQuery({ queryKey: keys.requests, queryFn: api.requests.list, enabled: member });
}

export function useChats() {
  const member = useMemberGate();
  return useQuery({ queryKey: keys.chats, queryFn: api.chat.list, enabled: member });
}

export function useMessages(connectionId: string | undefined) {
  return useQuery({
    queryKey: keys.messages(connectionId ?? ''),
    queryFn: () => api.chat.messages(connectionId!),
    enabled: !!connectionId,
  });
}

export function useNotifications() {
  const member = useMemberGate();
  return useQuery({ queryKey: keys.notifications, queryFn: api.notifications.list, enabled: member });
}

export function useSaved() {
  return useQuery({ queryKey: keys.saved, queryFn: api.saved.list });
}

export function useBlocked() {
  return useQuery({ queryKey: keys.blocked, queryFn: api.safety.blocked });
}

export function useStats() {
  return useQuery({ queryKey: keys.stats, queryFn: api.me.stats });
}

export function useMyRating(memberId: string | undefined) {
  return useQuery({ queryKey: keys.myRating(memberId ?? ''), queryFn: () => api.safety.myRating(memberId!), enabled: !!memberId });
}

/** Short-lived link for a private photo. Cached for 50 minutes (links last 60). */
export function useSignedUrl(path: string | null | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: keys.signed(path ?? ''),
    queryFn: () => api.signedUrl(path!),
    enabled: !!path && !!session,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  }).data;
}

/* ---------------- mutations ---------------- */

export function useSendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { memberId: string; note: string }) => api.requests.send(v.memberId, v.note),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: keys.member(v.memberId) });
      qc.invalidateQueries({ queryKey: keys.requests });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useRespondRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { requestId: string; accept: boolean }) => api.requests.respond(v.requestId, v.accept),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.requests });
      qc.invalidateQueries({ queryKey: keys.chats });
      qc.invalidateQueries({ queryKey: ['member'] });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.requests.withdraw(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.requests });
      qc.invalidateQueries({ queryKey: ['member'] });
    },
  });
}

export function useSendMessage(connectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.chat.send(connectionId, body),
    onSuccess: (msg) => {
      addMessageToCache(qc, msg);
      qc.invalidateQueries({ queryKey: keys.chats });
    },
  });
}

export function addMessageToCache(qc: ReturnType<typeof useQueryClient>, msg: Message) {
  qc.setQueryData<Message[]>(keys.messages(msg.connection_id), (old) => {
    if (!old) return old;
    if (old.some((m) => m.id === msg.id)) return old;
    return [...old, msg];
  });
}

export function useSetSaved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { memberId: string; save: boolean }) => api.saved.set(v.memberId, v.save),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: keys.saved });
      qc.invalidateQueries({ queryKey: keys.member(v.memberId) });
    },
  });
}

export function useBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.safety.block(memberId),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useUnblock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.safety.unblock(memberId),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (v: { memberId: string; reason: ReportReason; details: string }) =>
      api.safety.report(v.memberId, v.reason, v.details),
  });
}

export function useRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { memberId: string; rating: MyRating }) => api.safety.rate(v.memberId, v.rating),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: keys.myRating(v.memberId) });
      qc.invalidateQueries({ queryKey: keys.member(v.memberId) });
    },
  });
}
