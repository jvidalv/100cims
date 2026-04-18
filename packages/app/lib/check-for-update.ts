import * as Linking from "expo-linking";
import { Platform } from "react-native";

const STORE_URL = Platform.select({
  ios: "https://apps.apple.com/us/app/100cims/id6740161401",
  android: "https://play.google.com/store/apps/details?id=app.x100cims.x100cims",
  default: "https://cims-sempre-amunt.app",
});

export const checkForUpdate = async (): Promise<void> => {
  await Linking.openURL(STORE_URL);
};
