import createClient from "openapi-fetch";
import { Platform } from "react-native";

import { APP_BUILD_VERSION } from "@/lib/app-version";
import type { paths } from "@/types/api";

const apiClient = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
});

let authToken: string | null = null;

apiClient.use({
  onRequest({ request }) {
    request.headers.set("x-app-platform", Platform.OS);
    request.headers.set("x-app-version", APP_BUILD_VERSION);
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

export default apiClient;
