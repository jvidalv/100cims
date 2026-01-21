import { Elysia } from "elysia";

import { allRoute } from "@/api/routes/public/mountains/all.route";
import { oneRoute } from "@/api/routes/public/mountains/one.route";
import { summitsRoute } from "@/api/routes/public/mountains/summits.route";

export const mountainsRoutes = new Elysia({ prefix: "/mountains" })
  .use(oneRoute)
  .use(allRoute)
  .use(summitsRoute);
