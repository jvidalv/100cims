import "tsx/cjs"; // Add this to import TypeScript files
import { ExpoConfig } from "@expo/config-types";

const config: ExpoConfig & { newArchEnabled?: boolean } = {
  name: "100cims",
  slug: "100cims",
  version: "2.3.0",
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
    softwareKeyboardLayoutMode: "pan",
    adaptiveIcon: {
      foregroundImage: "./assets/images/mountain.png",
      backgroundColor: "#000000",
    },
    package: "app.x100cims.x100cims",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
  plugins: [
    [
      "expo-alternate-app-icons",
      [
        {
          name: "Light",
          ios: "./assets/images/app-icons/icon-light.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-light-fg.png",
            backgroundColor: "#ffffff",
          },
        },
        {
          name: "Merch",
          ios: "./assets/images/app-icons/icon-merch.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-merch-fg.png",
            backgroundColor: "#7B3058",
          },
        },
        {
          name: "Share",
          ios: "./assets/images/app-icons/icon-share.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-share-fg.png",
            backgroundColor: "#ffffff",
          },
        },
        {
          name: "Forcat",
          ios: "./assets/images/app-icons/icon-forcat.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-forcat-fg.png",
            backgroundColor: "#000000",
          },
        },
        {
          name: "Picat",
          ios: "./assets/images/app-icons/icon-picat.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-picat-fg.png",
            backgroundColor: "#2D496E",
          },
        },
      ],
    ],
    "./plugins/with-alternate-icons-plist",
    "expo-localization",
    "expo-apple-authentication",
    "expo-router",
    "expo-font",
    "expo-notifications",
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
        image: "./assets/images/logo-dark.png",
        imageWidth: 280,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/images/logo-light.png",
          backgroundColor: "#000000",
        },
        android: {
          imageWidth: 192,
          resizeMode: "contain",
        },
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
        iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_IOS_GOOGLE_MAPS_API_KEY,
        androidGoogleMapsApiKey:
          process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY,
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.914334353075-u32g2ki8cpmpns6kvo7lrmv27ecg3gfu",
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
  runtimeVersion: "appVersion",
  updates: {
    url: "https://u.expo.dev/b06b0874-9640-4da6-9acc-227afe51cfd1",
  },
};

export default config;
