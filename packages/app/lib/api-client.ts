import createClient from "openapi-fetch";
import { Platform } from "react-native";

import { APP_BUILD_VERSION } from "@/lib/app-version";
import { getLocale } from "@/lib/locale";
import type { paths } from "@/types/api";

const HEADER = {
  PLATFORM: "x-app-platform",
  VERSION: "x-app-version",
  LATITUDE: "x-app-latitude",
  LONGITUDE: "x-app-longitude",
  LOCALE: "x-app-locale",
} as const;

const apiClient = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
});

let authToken: string | null = null;
let currentCoords: { latitude: number; longitude: number } | null = null;

apiClient.use({
  onRequest({ request }) {
    request.headers.set(HEADER.PLATFORM, Platform.OS);
    request.headers.set(HEADER.VERSION, APP_BUILD_VERSION);
    request.headers.set(HEADER.LOCALE, getLocale());
    if (currentCoords) {
      request.headers.set(HEADER.LATITUDE, currentCoords.latitude.toString());
      request.headers.set(HEADER.LONGITUDE, currentCoords.longitude.toString());
    }
    if (authToken) {
      request.headers.set("Authorization", `Bearer ${authToken}`);
    } else {
      request.headers.delete("Authorization");
    }
    return request;
  },
});

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

export const setApiLocation = (
  coords: { latitude: number; longitude: number } | null,
) => {
  currentCoords = coords;
};

export default apiClient;
