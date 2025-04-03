import { Elysia } from "elysia";

import { challengeRoute } from "@/api/routes/public/challenge.route";
import { hiscoresRoute } from "@/api/routes/public/hiscores.route";
import { joinRoute } from "@/api/routes/public/join.route";
import { mountainsRoute } from "@/api/routes/public/mountains.route";
import { plansRoute } from "@/api/routes/public/plan.route";
import { userRoute } from "@/api/routes/public/user.route";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoute)
  .use(joinRoute)
  .use(hiscoresRoute)
  .use(challengeRoute)
  .use(userRoute)
  .use(plansRoute);
