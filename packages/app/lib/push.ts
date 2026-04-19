import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Colors } from "@/constants/colors";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Module-scoped promise ensures the channel is set up at most once per
// app process. Without this, every permission/token call re-crossed the
// native bridge — idempotent on Android but not free.
let androidChannelPromise: Promise<void> | null = null;

const ensureAndroidChannel = (): Promise<void> => {
  if (Platform.OS !== "android") return Promise.resolve();
  if (!androidChannelPromise) {
    androidChannelPromise = Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: Colors.light.primary,
    }).then(() => undefined);
  }
  return androidChannelPromise;
};

const getExpoPushToken = async (): Promise<string | null> => {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("[push] Missing EAS projectId");
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (err) {
    console.warn("[push] getExpoPushTokenAsync failed:", err);
    return null;
  }
};

/**
 * Returns the Expo push token only if the user has ALREADY granted permission.
 * Never asks the OS for permission — the pre-permission CTA (see
 * `hooks/use-ask-push-permission.ts`) drives that flow explicitly.
 */
export const getPushTokenIfGranted = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;
  await ensureAndroidChannel();

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return null;

  return getExpoPushToken();
};

/**
 * Triggers the native OS permission dialog and returns the resulting status.
 * Caller is responsible for ensuring this is invoked only in a context where
 * the user has just confirmed via our in-app CTA — iOS only shows the native
 * dialog once per install.
 */
export const requestPushPermission = async (): Promise<
  "granted" | "denied" | "undetermined"
> => {
  if (!Device.isDevice) return "denied";
  await ensureAndroidChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
};
