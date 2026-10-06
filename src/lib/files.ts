import { decode } from 'base64-arraybuffer';

/** base64 (from the image manipulator) → bytes for Supabase Storage. */
export function base64ToBytes(b64: string): ArrayBuffer {
  return decode(b64);
}
