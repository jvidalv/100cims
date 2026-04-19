import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { ANDROID_APP_URL, IOS_APP_URL, SITE_URL } from "@/lib/app-links";

const STORE_URL = Platform.select({
  ios: IOS_APP_URL,
  android: ANDROID_APP_URL,
  default: SITE_URL,
});

export const checkForUpdate = async (): Promise<void> => {
  await Linking.openURL(STORE_URL);
};
