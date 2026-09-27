import * as Location from 'expo-location';
import ngeohash from 'ngeohash';

export type Coords = { lat: number; lng: number };

export type LocationResult =
  | { status: 'granted'; coords: Coords; city: string | null; area: string | null; geohash: string | null }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'unavailable' };

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

/**
 * Foreground-only location. Called once when the app opens.
 * No background permission is ever requested (blocked in app.json too).
 */
export async function resolveLocation(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return { status: 'denied', canAskAgain: permission.canAskAgain };
    }
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) return { status: 'unavailable' };

    const coords = await getFix();
    if (!coords) return { status: 'unavailable' };

    const { city, area } = await detectPlace(coords);
    return { status: 'granted', coords, city, area, geohash: toGeohash(coords.lat, coords.lng) };
  } catch (e) {
    console.warn('[location] could not resolve location', e);
    return { status: 'unavailable' };
  }
}

async function getFix(): Promise<Coords | null> {
  const recent = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
  if (recent) return { lat: recent.coords.latitude, lng: recent.coords.longitude };

  const current = await withTimeout<Location.LocationObject>(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    12000,
  );
  return current ? { lat: current.coords.latitude, lng: current.coords.longitude } : null;
}

/** Uses the phone's built-in geocoder (free — no Google Maps API). */
async function detectPlace(coords: Coords): Promise<{ city: string | null; area: string | null }> {
  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lng,
    });
    const city = place?.city ?? place?.subregion ?? null;
    const area = place?.district ?? place?.subregion ?? null;
    return { city, area: area && area !== city ? area : null };
  } catch {
    return { city: null, area: null };
  }
}

// Precision 6 ≈ 1.2 km × 0.6 km cells (roughly H3 resolution 8)
export const GEOHASH_PRECISION = 6;

export function toGeohash(lat: number, lng: number, precision = GEOHASH_PRECISION): string {
  return ngeohash.encode(lat, lng, precision);
}

// The cell plus its 8 surrounding cells, for "nearby" queries
export function nearbyGeohashes(hash: string): string[] {
  return [hash, ...ngeohash.neighbors(hash)];
}

/**
 * What the app will send to the backend later. Coordinates are stored
 * server-side but are never returned to other members — they only ever
 * receive a distance.
 */
export function buildLocationPayload(coords: Coords, geohash: string | null) {
  return {
    lat: coords.lat,
    lng: coords.lng,
    geohash: geohash,
    captured_at: new Date().toISOString(),
    source: 'device' as const,
  };
}

/**
 * Members who keep "Show my exact distance" off are shown in 0.5 km bands
 * ("~1.5 km"), which makes it much harder to pinpoint someone by
 * measuring distances from several places.
 */
export function formatDistance(km: number, precise: boolean): string {
  if (precise) return `${km.toFixed(1)} km`;
  const banded = Math.max(0.5, Math.round(km * 2) / 2);
  return `~${banded % 1 === 0 ? banded.toFixed(0) : banded.toFixed(1)} km`;
}
