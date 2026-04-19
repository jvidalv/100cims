import * as Device from "expo-device";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

type LocationPermissionStatus = "pending" | "granted" | "denied" | "error";

type UseLocationOptions = {
  /**
   * When true, fires the OS permission dialog on mount if status is
   * undetermined. When false, only reads the current permission state and
   * returns the location iff it was already granted previously. Callers
   * that render outside a user-initiated "show me nearby peaks" moment
   * should always pass false so we don't prompt without context.
   */
  prompt?: boolean;
};

export function useLocation({ prompt = false }: UseLocationOptions = {}) {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [status, setStatus] = useState<LocationPermissionStatus>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveLocation() {
      if (Platform.OS === "android" && !Device.isDevice) {
        setStatus("error");
        setError(
          "Location does not work on Android emulator. Try a physical device.",
        );
        return;
      }

      const { status: permissionStatus } = prompt
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (permissionStatus !== "granted") {
        setStatus("denied");
        setError("Permission to access location was denied");
        return;
      }

      setStatus("granted");
      try {
        const loc = await Location.getLastKnownPositionAsync();
        setLocation(loc);
      } catch {
        setStatus("error");
        setError("Failed to get current location");
      }
    }

    void resolveLocation();
  }, [prompt]);

  return { location, status, error };
}
