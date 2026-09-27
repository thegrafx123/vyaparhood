import * as api from '../api';
import { LocationState } from '../state/AppStore';
import { reportError } from './sentry';

/** Sends this session's location (device reading or typed address) to Supabase. */
export async function syncLocation(loc: LocationState) {
  try {
    if (loc.coords) {
      await api.location.saveDevice({
        lat: loc.coords.lat,
        lng: loc.coords.lng,
        geohash: loc.geohash,
        area: loc.detectedArea,
        city: loc.detectedCity,
      });
    } else if (loc.manualAddress) {
      await api.location.saveManual(loc.manualAddress);
    }
  } catch (e) {
    reportError(e, { where: 'syncLocation' });
  }
}
