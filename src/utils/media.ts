import * as ImagePicker from 'expo-image-picker';

/** Opens the photo library. `exif: false` keeps GPS metadata out of the result. */
export async function pickProfilePhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    exif: false,
  });
  // Backend later: re-encode the image before upload so no location metadata survives.
  return res.canceled ? null : (res.assets[0]?.uri ?? null);
}
