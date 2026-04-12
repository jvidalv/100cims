import apiClient from "@/lib/api-client";

export const logError = (error: unknown, route?: string) => {
  const err = error instanceof Error ? error : new Error(String(error));
  void apiClient.POST("/api/public/log-error", {
    body: {
      message: err.message,
      stack: err.stack,
      route,
    },
  });
};
