import { treaty } from "@elysiajs/eden";
import { Treaty } from "@elysiajs/eden/dist/treaty2";

import { App } from "@/api/routes";

export const request = (config?: Treaty.Config) =>
  treaty<App>(process.env.EXPO_PUBLIC_API_URL || "", {
    ...config,
  });

export const api = request().api;
