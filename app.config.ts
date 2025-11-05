import "tsx/cjs"; // Add this to import TypeScript files
import { ExpoConfig } from "@expo/config-types";

const config: ExpoConfig = {
  name: "100cims",
  slug: "100cims",
  version: "2.1.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "centcims",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    appStoreUrl: "https://apps.apple.com/us/app/100cims/id6740161401",
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: "app.100cims.100cims",
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      CFBundleLocalizations: ["en", "ca", "es"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=app.x100cims.x100cims",
    googleServicesFile: "./google-services.json",
    softwareKeyboardLayoutMode: "pan",
    adaptiveIcon: {
      foregroundImage: "./assets/images/mountain.png",
      backgroundColor: "#f43f5e",
    },
    package: "app.x100cims.x100cims",
  },
  web: {
    bundler: "metro",
    output: "server",
  },
  plugins: [
    "expo-localization",
    "expo-apple-authentication",
    "expo-router",
    "expo-font",
    [
      "expo-image-picker",
      {
        photosPermission:
          "The app accesses your photos to let you share them with your friends.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/mountain.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#f43f5e",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow $(PRODUCT_NAME) to use your location.",
      },
    ],
    "expo-web-browser",
    [
      "react-native-maps",
      {
        iosGoogleMapsApiKey: process.env.IOS_GOOGLE_MAPS_API_KEY,
        androidGoogleMapsApiKey: process.env.ANDROID_GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "b06b0874-9640-4da6-9acc-227afe51cfd1",
    },
  },
  runtimeVersion: "1.0.0",
  updates: {
    url: "https://u.expo.dev/b06b0874-9640-4da6-9acc-227afe51cfd1",
  },
};

export default config;
