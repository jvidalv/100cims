import { Elysia } from "elysia";

import { activeRoute } from "@/api/routes/public/challenge/active.route";
import { allRoute } from "@/api/routes/public/challenge/all.route";
import { detailRoute } from "@/api/routes/public/challenge/detail.route";

export const challengeRoutes = new Elysia({ prefix: "/challenge" })
  .use(activeRoute)
  .use(allRoute)
  .use(detailRoute);
