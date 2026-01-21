import * as ImagePicker from "expo-image-picker";
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useIntl } from "react-intl";

import { getImageOptimized } from "@/lib/images";

type UseImagePickerOptions = {
  initialUri?: string | null;
};

type UseImagePickerReturn = {
  imageUri: string | null;
  imageBase64: string | null;
  hasChanged: boolean;
  pickImage: () => Promise<void>;
  reset: (newUri?: string | null) => void;
};

/**
 * Hook for picking and optimizing images
 */
export function useImagePicker(options: UseImagePickerOptions = {}): UseImagePickerReturn {
  const intl = useIntl();
  const [imageUri, setImageUri] = useState<string | null>(options.initialUri ?? null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [hasChanged, setHasChanged] = useState(false);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const pickedImage = result.assets[0];
        setImageUri(pickedImage.uri);

        const imageOptimized = await getImageOptimized(pickedImage);
        if (imageOptimized.base64) {
          setImageBase64(imageOptimized.base64);
          setHasChanged(true);
        }
      }
    } catch {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again or use another image.",
        })
      );
    }
  }, [intl]);

  const reset = useCallback((newUri?: string | null) => {
    setImageUri(newUri ?? null);
    setImageBase64(null);
    setHasChanged(false);
  }, []);

  return {
    imageUri,
    imageBase64,
    hasChanged,
    pickImage,
    reset,
  };
}
