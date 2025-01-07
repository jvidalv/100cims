import { Elysia } from "elysia";

import { hiscoresRoute } from "@/api/routes/public/hiscores.route";
import { joinRoute } from "@/api/routes/public/join.route";
import { mountainsRoute } from "@/api/routes/public/mountains.route";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoute)
  .use(joinRoute)
  .use(hiscoresRoute);
