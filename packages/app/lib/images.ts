import { ImageManipulator } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";

/**
 * Target cap for the longest edge of uploaded images. 1600 px gives enough
 * detail for full-screen retina display + moderate zoom headroom while
 * keeping JPEG output comfortably under the server's 3 MB limit.
 */
const DEFAULT_MAX_EDGE = 1600;

/**
 * JPEG quality for the single compression pass. 0.85 is the usual sweet
 * spot: visually indistinguishable from source for most photos, big file
 * savings. Combined with the picker's `quality: 0.9`, the compounded loss
 * is modest.
 */
const DEFAULT_COMPRESS = 0.85;

/**
 * Downscale (never upscale) a picked image and re-encode as JPEG with
 * base64 output, ready for upload. Keeps aspect ratio.
 */
export const getImageOptimized = async (
  image: ImagePickerAsset,
  {
    maxEdge = DEFAULT_MAX_EDGE,
    compress = DEFAULT_COMPRESS,
  }: { maxEdge?: number; compress?: number } = {},
) => {
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.floor(image.width * scale));
  const targetHeight = Math.max(1, Math.floor(image.height * scale));

  const manipulate = ImageManipulator.manipulate(image.uri);
  manipulate.resize({ width: targetWidth, height: targetHeight });
  const rendered = await manipulate.renderAsync();

  return rendered.saveAsync({
    base64: true,
    compress,
  });
};

/**
 * Launch the system image picker and return the optimized result, or `null`
 * if the user canceled. Keeps a single pipeline shape across the app.
 *
 * The picker is asked for `quality: 1` so the first pass isn't lossy;
 * compression happens once in `getImageOptimized`.
 */
export const pickAndOptimizeImage = async (options?: {
  aspect?: [number, number];
}) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: !!options?.aspect,
    aspect: options?.aspect,
    quality: 1,
  });

  if (result.canceled) return null;

  const picked = result.assets[0];
  const optimized = await getImageOptimized(picked);
  return { picked, optimized };
};
