import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SortBy } from '../api/types';
import { CategoryId, DEFAULT_DISTANCE_KM } from '../config';
import { Coords } from '../services/location';

/**
 * Device-only state: this session's live location reading, Discover
 * filters, and a few "have we already shown this?" flags kept on the
 * phone. Everything else comes from Supabase.
 */

export interface LiveState {
  status: 'unknown' | 'granted' | 'denied' | 'unavailable';
  coords: Coords | null;
  city: string | null;
  area: string | null;
}

export interface Filters {
  distanceKm: number;
  categories: CategoryId[];
  sortBy: SortBy;
  verifiedOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  distanceKm: DEFAULT_DISTANCE_KM,
  categories: [],
  sortBy: 'nearest',
  verifiedOnly: false,
};

/** Remembered on the phone between launches. */
export interface Flags {
  /** Slide 2b ("Your Surat business, sorted") is shown only once. */
  cityIntroShown: boolean;
  /** The member said no in our location dialog; don't ask on every launch. */
  locationDeclined: boolean;
  /** Slide 13 (notifications) has been shown. */
  notificationsPrompted: boolean;
}

const DEFAULT_FLAGS: Flags = { cityIntroShown: false, locationDeclined: false, notificationsPrompted: false };
const FLAGS_KEY = 'vh.flags.v1';

interface AppState {
  live: LiveState;
  filters: Filters;
  discoverMode: 'nearby' | 'citywide';
  /** City shown in Citywide; null = the member's own. */
  discoverCity: string | null;
  flags: Flags;
  flagsReady: boolean;
}

const initialState = (): AppState => ({
  live: { status: 'unknown', coords: null, city: null, area: null },
  filters: DEFAULT_FILTERS,
  discoverMode: 'citywide',
  discoverCity: null,
  flags: DEFAULT_FLAGS,
  flagsReady: false,
});

function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    AsyncStorage.getItem(FLAGS_KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as Partial<Flags>) : {};
        setState((st) => ({ ...st, flags: { ...DEFAULT_FLAGS, ...saved }, flagsReady: true }));
      })
      .catch(() => setState((st) => ({ ...st, flagsReady: true })));
  }, []);

  const actions = useMemo(
    () => ({
      setLive: (live: Partial<LiveState>) => setState((st) => ({ ...st, live: { ...st.live, ...live } })),
      applyFilters: (filters: Filters) => setState((st) => ({ ...st, filters })),
      setDiscoverMode: (discoverMode: 'nearby' | 'citywide') => setState((st) => ({ ...st, discoverMode })),
      setDiscoverCity: (discoverCity: string | null) => setState((st) => ({ ...st, discoverCity })),
      setFlag: (key: keyof Flags, value: boolean) =>
        setState((st) => {
          const flags = { ...st.flags, [key]: value };
          AsyncStorage.setItem(FLAGS_KEY, JSON.stringify(flags)).catch(() => {});
          return { ...st, flags };
        }),
      /** On sign-out: forget filters, keep device flags. */
      resetSession: () =>
        setState((st) => ({ ...initialState(), flags: st.flags, flagsReady: st.flagsReady, live: st.live })),
    }),
    [],
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
