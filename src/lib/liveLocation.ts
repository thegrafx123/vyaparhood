import * as api from '../api';
import { readLive } from '../services/location';
import { LiveState } from '../state/AppStore';
import { reportError } from './sentry';

/**
 * Reads where the phone is now and, if signed in, saves it as the
 * member's live location (used only as the start of their own Nearby
 * search — never shown to anyone).
 */
export async function refreshLiveLocation(opts: {
  signedIn: boolean;
  onFix?: (live: Partial<LiveState>) => void;
}): Promise<Partial<LiveState> | null> {
  const fix = await readLive();
  if (!fix) {
    opts.onFix?.({ status: 'unavailable' });
    return null;
  }
  const live: Partial<LiveState> = { status: 'granted', coords: fix.coords, city: fix.city, area: fix.area };
  opts.onFix?.(live);
  if (opts.signedIn) {
    try {
      await api.location.updateLive({ lat: fix.coords.lat, lng: fix.coords.lng, city: fix.city, locality: fix.area });
    } catch (e) {
      reportError(e, { where: 'updateLive' });
    }
  }
  return live;
}
