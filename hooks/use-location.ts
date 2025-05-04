import * as Device from "expo-device";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

type LocationPermissionStatus = "pending" | "granted" | "denied" | "error";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [status, setStatus] = useState<LocationPermissionStatus>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function requestLocation() {
      if (Platform.OS === "android" && !Device.isDevice) {
        setStatus("error");
        setError(
          "Location does not work on Android emulator. Try a physical device.",
        );
        return;
      }

      const { status: permissionStatus } =
        await Location.requestForegroundPermissionsAsync();

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

    void requestLocation();
  }, []);

  return { location, status, error };
}
