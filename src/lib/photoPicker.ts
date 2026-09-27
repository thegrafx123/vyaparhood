import * as ImagePicker from 'expo-image-picker';

export type PickedPhoto = { uri: string; base64: string; mime: string };

/**
 * Opens the photo library and returns the image bytes (base64) for upload.
 * `exif: false` keeps GPS and camera metadata out of what we upload.
 */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    exif: false,
    base64: true,
  });
  const a = res.canceled ? null : res.assets[0];
  if (!a?.base64) return null;
  return { uri: a.uri, base64: a.base64, mime: a.mimeType ?? 'image/jpeg' };
}
