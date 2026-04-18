import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useIntl } from "react-intl";

import { pickAndOptimizeImage } from "@/lib/images";
import { logError } from "@/lib/log-error";

type UseImagePickerOptions = {
  initialUri?: string | null;
  /**
   * Fixed crop aspect. When set, the picker shows a cropping UI locked to
   * this ratio on both iOS and Android. Leave undefined to let the user
   * submit photos at their original aspect ratio (the default).
   */
  aspect?: [number, number];
  /**
   * Tag used when reporting errors via `logError`. Defaults to "image-picker".
   */
  logTag?: string;
};

type UseImagePickerReturn = {
  imageUri: string | null;
  imageBase64: string | null;
  hasChanged: boolean;
  isLoading: boolean;
  pickImage: () => Promise<void>;
  reset: (newUri?: string | null) => void;
};

/**
 * Pick an image from the user's library and produce a compressed base64
 * payload ready for upload. Single compression pass in the manipulator —
 * the picker is asked for maximum quality so we don't stack lossy passes.
 */
export function useImagePicker(
  options: UseImagePickerOptions = {},
): UseImagePickerReturn {
  const intl = useIntl();
  const [imageUri, setImageUri] = useState<string | null>(
    options.initialUri ?? null,
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [hasChanged, setHasChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await pickAndOptimizeImage({ aspect: options.aspect });
      if (result?.optimized.base64) {
        setImageUri(result.picked.uri);
        setImageBase64(result.optimized.base64);
        setHasChanged(true);
      }
    } catch (error) {
      logError(error, options.logTag ?? "image-picker");
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again or use another image.",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [intl, options.aspect, options.logTag]);

  const reset = useCallback((newUri?: string | null) => {
    setImageUri(newUri ?? null);
    setImageBase64(null);
    setHasChanged(false);
  }, []);

  return {
    imageUri,
    imageBase64,
    hasChanged,
    isLoading,
    pickImage,
    reset,
  };
}
