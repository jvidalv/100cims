import { Elysia } from "elysia";

import { challengeRoutes } from "@/api/routes/public/challenge";
import { hiscoresRoutes } from "@/api/routes/public/hiscores";
import { joinRoute } from "@/api/routes/public/join.route";
import { mountainsRoutes } from "@/api/routes/public/mountains";
import { plansRoute } from "@/api/routes/public/plan.route";
import { userRoute } from "@/api/routes/public/user.route";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoutes)
  .use(joinRoute)
  .use(hiscoresRoutes)
  .use(challengeRoutes)
  .use(userRoute)
  .use(plansRoute);
