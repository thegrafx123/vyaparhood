import React, { createContext, useContext, useMemo, useState } from 'react';
import { CategoryId, DEFAULT_DISTANCE_KM } from '../config';
import { Coords } from '../services/location';

/**
 * Device-only state that never needs to be on the server as-is:
 * this session's location reading, the city picked during sign-up,
 * and Discover filters. Everything else comes from Supabase.
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
  detectedArea: string | null;
  manualAddress: ManualAddress | null;
  canAskAgain: boolean;
}

export type SortBy = 'nearest' | 'newest' | 'rating';

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

interface AppState {
  location: LocationState;
  city: string | null;
  filters: Filters;
  filtersApplied: boolean;
}

const initialState = (): AppState => ({
  location: {
    status: 'unknown',
    source: null,
    coords: null,
    geohash: null,
    detectedCity: null,
    detectedArea: null,
    manualAddress: null,
    canAskAgain: true,
  },
  city: null,
  filters: DEFAULT_FILTERS,
  filtersApplied: false,
});

function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const actions = useMemo(
    () => ({
      setLocation: (loc: Partial<LocationState>) => setState((s) => ({ ...s, location: { ...s.location, ...loc } })),
      setCity: (city: string) => setState((s) => ({ ...s, city })),
      applyFilters: (filters: Filters) => setState((s) => ({ ...s, filters, filtersApplied: true })),
      reset: () => setState(initialState()),
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
