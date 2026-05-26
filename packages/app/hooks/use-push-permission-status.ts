import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

/**
 * Reactive read of the OS push-notification permission. Re-checks whenever the
 * app returns to the foreground so a user who flips the toggle in Settings and
 * comes back sees the UI catch up without a relaunch. Returns `null` until the
 * first read resolves.
 */
export const usePushPermissionStatus = (): PushPermissionStatus | null => {
  const [status, setStatus] = useState<PushPermissionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const read = async () => {
      const result = await Notifications.getPermissionsAsync();
      if (cancelled) return;
      setStatus(result.status as PushPermissionStatus);
    };

    void read();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void read();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return status;
};
