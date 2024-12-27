import { treaty } from "@elysiajs/eden";
import { App } from "@/api/routes";
import { getJwt } from "@/lib/auth";

const app = treaty<App>(process.env.EXPO_PUBLIC_API_URL || "", {
  headers: (path) => {
    if (path.startsWith("/api/protected")) {
      return [{ Authorization: `Bearer ${getJwt()}` }];
    }

    return {};
  },
});

export const api = app.api;
