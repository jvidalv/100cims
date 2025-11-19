import createClient from "openapi-fetch";

import type { paths } from "@/types/api";

// Create type-safe API client
const apiClient = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
});

// Helper to set auth token
export const setAuthToken = (token: string) => {
  apiClient.use({
    onRequest({ request }) {
      request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
  });
};

// Helper to clear auth token
export const clearAuthToken = () => {
  // Reset client to remove auth header
  apiClient.use({
    onRequest({ request }) {
      request.headers.delete("Authorization");
      return request;
    },
  });
};

export default apiClient;
