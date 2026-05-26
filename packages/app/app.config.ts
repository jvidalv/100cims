import "tsx/cjs"; // Add this to import TypeScript files
import { ExpoConfig } from "@expo/config-types";

// `@rnmapbox/maps`'s config plugin reads `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` from
// the environment (its new convention — the plugin option that used to ship
// the token is now deprecated and prints a "token will be part of your
// gradle.properties" warning on every prebuild). Our canonical secret name
// is `MAPBOX_DOWNLOADS_TOKEN` (set in `.env.local` for dev + as an EAS
// secret for cloud builds), so alias it here at config evaluation time —
// keeps a single source of truth without renaming the EAS secret.
if (process.env.MAPBOX_DOWNLOADS_TOKEN && !process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN) {
  process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN = process.env.MAPBOX_DOWNLOADS_TOKEN;
}

const config: ExpoConfig & { newArchEnabled?: boolean } = {
  name: "Cims",
  slug: "100cims",
  version: "3.1.0",
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
      "@howincodes/expo-dynamic-app-icon",
      {
        Light: {
          ios: "./assets/images/app-icons/icon-light.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-light-fg.png",
            backgroundColor: "#ffffff",
          },
        },
        Vell: {
          ios: "./assets/images/app-icons/icon-vell.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-vell-fg.png",
            backgroundColor: "#E1304A",
          },
        },
        Merch: {
          ios: "./assets/images/app-icons/icon-merch.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-merch-fg.png",
            backgroundColor: "#7B3058",
          },
        },
        Share: {
          ios: "./assets/images/app-icons/icon-share.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-share-fg.png",
            backgroundColor: "#1A0A2E",
          },
        },
        Forcat: {
          ios: "./assets/images/app-icons/icon-forcat.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-forcat-fg.png",
            backgroundColor: "#000000",
          },
        },
        Picat: {
          ios: "./assets/images/app-icons/icon-picat.png",
          android: {
            foregroundImage: "./assets/images/app-icons/icon-picat-fg.png",
            backgroundColor: "#2D496E",
          },
        },
      },
    ],
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
          image: "./assets/images/logo-dark-android.png",
          dark: {
            image: "./assets/images/logo-light-android.png",
          },
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
      "@rnmapbox/maps",
      {
        // The download token (DOWNLOADS:READ scope) is read from the
        // `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` env var by the plugin — see the
        // alias at the top of this file. Don't add the legacy
        // `RNMapboxMapsDownloadToken` option back: it's deprecated and
        // makes prebuild write the secret into `gradle.properties`.
        //
        // Pin native SDK versions to avoid surprise upgrades. Must match
        // the Mapbox SDK that `@rnmapbox/maps` (currently 10.3.1) was
        // built against — see `node_modules/@rnmapbox/maps/package.json`
        // `mapbox.android` / `mapbox.ios`. Lower pins produce
        // "Unresolved reference: lineElevationGroundScale /
        // modelAllowDensityReduction" Kotlin compile errors.
        RNMapboxMapsVersion: "11.20.1",
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
