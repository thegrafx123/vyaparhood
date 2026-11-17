import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

export type PermissionState = { status: 'granted' | 'denied' | 'undetermined'; canAskAgain: boolean };

export type LiveFix = { coords: Coords; city: string | null; area: string | null };

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

/** Current foreground permission, without asking. */
export async function getPermission(): Promise<PermissionState> {
  try {
    const p = await Location.getForegroundPermissionsAsync();
    return { status: p.status as PermissionState['status'], canAskAgain: p.canAskAgain };
  } catch {
    return { status: 'undetermined', canAskAgain: true };
  }
}

/**
 * Shows the phone's own permission popup. Foreground only — background
 * location is never requested (it is blocked in app.json too).
 */
export async function requestPermission(): Promise<PermissionState> {
  try {
    const p = await Location.requestForegroundPermissionsAsync();
    return { status: p.status as PermissionState['status'], canAskAgain: p.canAskAgain };
  } catch {
    return { status: 'denied', canAskAgain: false };
  }
}

/** Where the phone is right now, plus its city and area. Needs permission. */
export async function readLive(): Promise<LiveFix | null> {
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) return null;
    const recent = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    let coords: Coords | null = recent ? { lat: recent.coords.latitude, lng: recent.coords.longitude } : null;
    if (!coords) {
      const current = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        12000,
      );
      coords = current ? { lat: current.coords.latitude, lng: current.coords.longitude } : null;
    }
    if (!coords) return null;
    const place = await placeFor(coords);
    return { coords, ...place };
  } catch (e) {
    console.warn('[location] could not read location', e);
    return null;
  }
}

/** Uses the phone's built-in geocoder (free — no Google Maps API key). */
async function placeFor(coords: Coords): Promise<{ city: string | null; area: string | null }> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
    const city = normaliseCity(place?.city ?? place?.subregion ?? null);
    const area = place?.district ?? place?.subregion ?? null;
    return { city, area: area && area !== city ? area : null };
  } catch {
    return { city: null, area: null };
  }
}

/**
 * Turns a typed business address into map coordinates using the phone's
 * geocoder. Returns null when it can't be placed — the server then tries
 * the pincode, and otherwise the business shows in Citywide only.
 */
export async function geocodeAddress(parts: {
  line: string;
  locality: string;
  city: string;
  pincode: string;
}): Promise<Coords | null> {
  const query = [parts.line, parts.locality, parts.city, parts.pincode, 'India'].filter(Boolean).join(', ');
  try {
    const results = await withTimeout(Location.geocodeAsync(query), 10000);
    const hit = results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lng: hit.longitude };
  } catch (e) {
    console.warn('[location] could not geocode address', e);
    return null;
  }
}

/**
 * One spelling per city: geocoders and people say "Bengaluru" or
 * "Bangalore", "New Delhi" or "Delhi"… Citywide matches on this name, so
 * every city is stored in its standard form. Keep in sync with
 * canonical_city() in supabase/migrations/20261102000000_canonical_cities.sql.
 */
const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  'bengaluru urban': 'Bengaluru',
  'bangalore urban': 'Bengaluru',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  'mumbai suburban': 'Mumbai',
  'mumbai city': 'Mumbai',
  'new delhi': 'Delhi NCR',
  delhi: 'Delhi NCR',
  'delhi ncr': 'Delhi NCR',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  madras: 'Chennai',
  chennai: 'Chennai',
  cochin: 'Kochi',
  ernakulam: 'Kochi',
  kochi: 'Kochi',
  mysore: 'Mysuru',
  mysuru: 'Mysuru',
  mangalore: 'Mangaluru',
  mangaluru: 'Mangaluru',
  trivandrum: 'Thiruvananthapuram',
  thiruvananthapuram: 'Thiruvananthapuram',
  poona: 'Pune',
  pune: 'Pune',
  baroda: 'Vadodara',
  vadodara: 'Vadodara',
  vizag: 'Visakhapatnam',
  visakhapatnam: 'Visakhapatnam',
  hyderabad: 'Hyderabad',
  ahmedabad: 'Ahmedabad',
  jaipur: 'Jaipur',
};

export function normaliseCity(city: string | null | undefined): string | null {
  const c = (city ?? '').trim().replace(/\s+/g, ' ');
  if (!c) return null;
  return CITY_ALIASES[c.toLowerCase()] ?? c;
}

/**
 * Members who keep "Show my exact distance" off are shown in 0.5 km bands
 * ("~1.5 km"), which makes it much harder to pinpoint someone by
 * measuring distances from several places.
 */
export function formatDistance(km: number | null | undefined, precise: boolean): string | null {
  if (km === null || km === undefined) return null;
  if (precise) return `${km.toFixed(1)} km`;
  const banded = Math.max(0.5, Math.round(km * 2) / 2);
  return `~${banded % 1 === 0 ? banded.toFixed(0) : banded.toFixed(1)} km`;
}
