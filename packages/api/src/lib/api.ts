import { treaty } from "@elysiajs/eden";

import type { App } from "@/api/routes";

const baseUrl =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin;

export const api = treaty<App>(baseUrl, {
  fetch: { credentials: "include" },
});
