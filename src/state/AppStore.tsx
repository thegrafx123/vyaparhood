import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CategoryId, DEFAULT_DISTANCE_KM } from '../config';
import {
  AppNotification,
  Chat,
  CHATS,
  ConnectionRequest,
  FALLBACK_ME,
  Member,
  MEMBERS,
  NOTIFICATIONS,
  REQUESTS,
  SAVED_IDS,
} from '../data/sample';
import { Coords } from '../services/location';
import { Entitlement, NO_ENTITLEMENT } from '../services/payments';
import { nowTime } from '../utils/validation';

/**
 * Prototype state lives in memory only. When the backend arrives, each
 * action below becomes an API call (Supabase/Postgres) and this store
 * becomes a cache of server data.
 */

export interface ManualAddress {
  pincode: string;
  locality: string;
  city: string;
  line: string;
}

export interface LocationState {
  status: 'unknown' | 'granted' | 'denied' | 'unavailable';
  source: 'device' | 'manual' | null;
  coords: Coords | null;
  geohash: string | null;
  detectedCity: string | null;
  manualAddress: ManualAddress | null;
  canAskAgain: boolean;
}

export interface PickedFile {
  name: string;
  uri: string;
  size: number | null;
  mimeType: string | null;
}

export interface MyProfile {
  photoUri: string | null;
  name: string;
  email: string;
  dob: string;
  building: string;
  category: CategoryId | null;
  social: string;
  bio: string;
  offers: string[];
  lookingFor: string[];
}

export type SortBy = 'nearest' | 'newest' | 'rating';

export interface Filters {
  distanceKm: number;
  categories: CategoryId[];
  sortBy: SortBy;
  verifiedOnly: boolean;
}

export interface Rating {
  memberId: string;
  stars: number;
  tags: string[];
  note: string;
}

export interface AppState {
  location: LocationState;
  phone: string;
  city: string | null;
  profile: MyProfile;
  documents: { businessProof: PickedFile | null; govId: PickedFile | null };
  verification: 'none' | 'pending' | 'verified';
  notificationsAllowed: boolean;
  entitlement: Entitlement;

  members: Member[];
  requests: ConnectionRequest[];
  chats: Chat[];
  notifications: AppNotification[];
  savedIds: string[];
  blockedIds: string[];
  ratings: Rating[];
  requestsSentCount: number;

  filters: Filters;
  filtersApplied: boolean;
  settings: { notifyRequests: boolean; notifyMessages: boolean; showExactDistance: boolean };
}

const emptyProfile: MyProfile = {
  photoUri: null,
  name: '',
  email: '',
  dob: '',
  building: '',
  category: null,
  social: '',
  bio: '',
  offers: [],
  lookingFor: [],
};

const initialState = (): AppState => ({
  location: {
    status: 'unknown',
    source: null,
    coords: null,
    geohash: null,
    detectedCity: null,
    manualAddress: null,
    canAskAgain: true,
  },
  phone: '',
  city: null,
  profile: emptyProfile,
  documents: { businessProof: null, govId: null },
  verification: 'none',
  notificationsAllowed: false,
  entitlement: NO_ENTITLEMENT,

  members: MEMBERS,
  requests: REQUESTS,
  chats: CHATS,
  notifications: NOTIFICATIONS,
  savedIds: SAVED_IDS,
  blockedIds: [],
  ratings: [],
  requestsSentCount: 0,

  filters: {
    distanceKm: DEFAULT_DISTANCE_KM,
    categories: ['food', 'creative'],
    sortBy: 'nearest',
    verifiedOnly: true,
  },
  filtersApplied: false,
  settings: { notifyRequests: true, notifyMessages: true, showExactDistance: false },
});

function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  const patch = useCallback((p: Partial<AppState>) => setState((s) => ({ ...s, ...p })), []);

  const actions = useMemo(
    () => ({
      patch,
      setLocation: (loc: Partial<LocationState>) =>
        setState((s) => ({ ...s, location: { ...s.location, ...loc } })),
      setProfile: (p: Partial<MyProfile>) =>
        setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      setDocument: (key: 'businessProof' | 'govId', file: PickedFile | null) =>
        setState((s) => ({ ...s, documents: { ...s.documents, [key]: file } })),
      setSettings: (p: Partial<AppState['settings']>) =>
        setState((s) => ({ ...s, settings: { ...s.settings, ...p } })),
      applyFilters: (filters: Filters) =>
        setState((s) => ({ ...s, filters, filtersApplied: true })),

      toggleSaved: (memberId: string) =>
        setState((s) => ({
          ...s,
          savedIds: s.savedIds.includes(memberId)
            ? s.savedIds.filter((id) => id !== memberId)
            : [...s.savedIds, memberId],
        })),

      sendRequest: (memberId: string, note: string) =>
        setState((s) => ({
          ...s,
          requestsSentCount: s.requestsSentCount + 1,
          requests: [
            ...s.requests,
            {
              id: `req-${memberId}-${Date.now()}`,
              memberId,
              note,
              direction: 'outgoing',
              createdAt: 'Just now',
            },
          ],
        })),

      withdrawRequest: (requestId: string) =>
        setState((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== requestId) })),

      declineRequest: (requestId: string) =>
        setState((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== requestId) })),

      /** Accepting unlocks chat. Open it with chatIdFor(state, memberId). */
      acceptRequest: (requestId: string) =>
        setState((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          if (!req) return s;
          const existing = s.chats.find((c) => c.memberId === req.memberId);
          const chats = existing
            ? s.chats
            : [
                {
                  id: `chat-${req.memberId}`,
                  memberId: req.memberId,
                  online: false,
                  unread: false,
                  lastTime: nowTime(),
                  messages: [
                    { id: 'sys', from: 'system' as const, text: 'Connection approved · You can chat now' },
                    { id: 'note', from: 'them' as const, text: req.note, time: nowTime() },
                  ],
                },
                ...s.chats,
              ];
          return { ...s, chats, requests: s.requests.filter((r) => r.id !== requestId) };
        }),

      sendMessage: (chatId: string, text: string) =>
        setState((s) => ({
          ...s,
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  lastTime: nowTime(),
                  messages: [
                    ...c.messages.map((m) => ({ ...m, time: undefined })),
                    { id: `m-${Date.now()}`, from: 'me' as const, text, time: nowTime() },
                  ],
                }
              : c,
          ),
        })),

      markChatRead: (chatId: string) =>
        setState((s) => ({
          ...s,
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, unread: false } : c)),
        })),

      markNotificationRead: (id: string) =>
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        })),

      blockMember: (memberId: string) =>
        setState((s) => ({
          ...s,
          blockedIds: [...new Set([...s.blockedIds, memberId])],
          savedIds: s.savedIds.filter((id) => id !== memberId),
          requests: s.requests.filter((r) => r.memberId !== memberId),
          chats: s.chats.filter((c) => c.memberId !== memberId),
        })),

      unblockAll: () => setState((s) => ({ ...s, blockedIds: [] })),

      addRating: (rating: Rating) =>
        setState((s) => ({
          ...s,
          ratings: [...s.ratings.filter((r) => r.memberId !== rating.memberId), rating],
        })),

      /** Log out / delete account in the prototype: wipe everything. */
      reset: () => setState(initialState()),
    }),
    [patch],
  );

  return { state, actions };
}

type Store = ReturnType<typeof useAppState>;
const AppContext = createContext<Store | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useAppState();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/* ---------- selectors ---------- */

export const getMember = (state: AppState, id: string) => state.members.find((m) => m.id === id);

export const displayName = (state: AppState) => state.profile.name.trim() || FALLBACK_ME.name;

export const myCity = (state: AppState) =>
  state.city ?? state.location.manualAddress?.city ?? state.location.detectedCity ?? 'Mumbai';

/** The chat that exists (or will exist once a request is accepted) with a member. */
export const chatIdFor = (state: AppState, memberId: string) =>
  state.chats.find((c) => c.memberId === memberId)?.id ?? `chat-${memberId}`;

export type RelationStatus = 'none' | 'outgoing' | 'incoming' | 'connected' | 'blocked';

export function relationWith(state: AppState, memberId: string): {
  status: RelationStatus;
  chatId?: string;
  requestId?: string;
} {
  if (state.blockedIds.includes(memberId)) return { status: 'blocked' };
  const chat = state.chats.find((c) => c.memberId === memberId);
  if (chat) return { status: 'connected', chatId: chat.id };
  const req = state.requests.find((r) => r.memberId === memberId);
  if (req) return { status: req.direction, requestId: req.id };
  return { status: 'none' };
}
