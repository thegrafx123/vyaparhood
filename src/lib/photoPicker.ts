import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { PHOTO_JPEG_QUALITY, PHOTO_SIZE_PX } from '../config';
import { base64ToBytes } from './files';

export type PickedPhoto = { uri: string; bytes: ArrayBuffer };

/**
 * Opens the photo library, crops square, then shrinks the photo to
 * 720 × 720 JPEG (usually 60–120 KB) so storage stays cheap.
 * `exif: false` keeps GPS and camera metadata out of what we upload.
 */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return null;

  const context = ImageManipulator.manipulate(asset.uri);
  if ((asset.width ?? PHOTO_SIZE_PX + 1) > PHOTO_SIZE_PX) context.resize({ width: PHOTO_SIZE_PX });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_JPEG_QUALITY, base64: true });
  if (!saved.base64) return null;
  return { uri: saved.uri, bytes: base64ToBytes(saved.base64) };
}
