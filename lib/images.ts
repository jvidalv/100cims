import { ImageManipulator } from "expo-image-manipulator";
import { ImagePickerAsset } from "expo-image-picker";

export const getImageOptimized = async (
  image: ImagePickerAsset,
  config: { compress: number; resizeBy: number } = {
    compress: 0.8,
    resizeBy: 3,
  },
) => {
  const manipulate = ImageManipulator.manipulate(image.uri);
  manipulate.resize({
    width: Math.floor(image.width / config.resizeBy),
    height: Math.floor(image.height / config.resizeBy),
  });

  const compressedImage = await manipulate.renderAsync();

  return compressedImage.saveAsync({
    base64: true,
    compress: config.compress,
  });
};
