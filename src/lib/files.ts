import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

/** Reads a local file (from the image or document picker) into bytes. */
export async function readFileBytes(uri: string): Promise<ArrayBuffer> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require('expo-file-system');
    if (FS?.File) {
      const bytes: Uint8Array = await new FS.File(uri).bytes();
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    }
  } catch {
    // fall through to fetch()
  }
  const res = await fetch(uri);
  return res.arrayBuffer();
}

export function base64ToBytes(b64: string): ArrayBuffer {
  return decode(b64);
}

export async function uploadToBucket(
  bucket: 'avatars' | 'verification-docs',
  path: string,
  data: ArrayBuffer,
  contentType: string,
) {
  const { error } = await supabase.storage.from(bucket).upload(path, data, { contentType, upsert: true });
  if (error) throw error;
  return path;
}

export function extensionFor(mime: string | null | undefined, fallbackName = '') {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  if (mime?.startsWith('image/')) return 'jpg';
  const fromName = fallbackName.split('.').pop();
  return fromName && fromName.length <= 5 ? fromName.toLowerCase() : 'bin';
}
