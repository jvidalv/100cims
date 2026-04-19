import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useCallback, useState } from "react";

import { usePushTokenMutation } from "@/domains/user/push.api";
import { getPushTokenIfGranted, requestPushPermission } from "@/lib/push";

// Timestamp (ms since epoch) of the user's most recent dismiss/confirm of
// our in-app CTA. Absence of the key = never asked. Re-ask after the cooldown.
const STORAGE_KEY = "push_prompt_last_asked_at";

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const isWithinCooldown = (raw: string | null): boolean => {
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < COOLDOWN_MS;
};

/**
 * Orchestrates the pre-permission CTA. Callers invoke `ask()` from a trigger
 * moment (e.g. first visit to Plans, first summit created); the hook decides
 * whether to surface the dialog based on OS permission state + a 7-day
 * cooldown on dismissals. `confirm()` triggers the native OS prompt and, on
 * success, re-registers the push token so the server sees the user opted in.
 */
export const useAskPushPermission = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: registerToken } = usePushTokenMutation();

  const ask = useCallback(
    async ({ bypassCooldown = false }: { bypassCooldown?: boolean } = {}) => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "undetermined") return;

      if (!bypassCooldown) {
        const lastAskedAt = await AsyncStorage.getItem(STORAGE_KEY);
        if (isWithinCooldown(lastAskedAt)) return;
      }

      setIsOpen(true);
    },
    [],
  );

  const dismiss = useCallback(async () => {
    setIsOpen(false);
    // Timestamp only lands after the user explicitly dismisses — not when
    // the dialog opens — so transient unmounts / re-renders don't consume
    // the cooldown.
    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  const confirm = useCallback(async () => {
    setIsOpen(false);
    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
    const status = await requestPushPermission();
    if (status !== "granted") return;
    const token = await getPushTokenIfGranted();
    if (!token) return;
    registerToken({ expoPushToken: token, pushNotificationsEnabled: true });
  }, [registerToken]);

  return { isOpen, ask, dismiss, confirm };
};
