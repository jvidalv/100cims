import { Elysia } from "elysia";

import { mountainAllGetRoute } from "@/api/routes/public/mountains/mountain.all.get";
import { mountainOneGetRoute } from "@/api/routes/public/mountains/mountain.one.get";
import { mountainSummitsGetRoute } from "@/api/routes/public/mountains/mountain.summits.get";

export const mountainsRoutes = new Elysia({ prefix: "/mountains" })
  .use(mountainOneGetRoute)
  .use(mountainAllGetRoute)
  .use(mountainSummitsGetRoute);
