import { Elysia } from "elysia";

import { challengeRoutes } from "@/api/routes/public/challenge";
import { hiscoresRoutes } from "@/api/routes/public/hiscores";
import { joinPostRoute } from "@/api/routes/public/join.post";
import { mountainsRoutes } from "@/api/routes/public/mountains";
import { publicPlansRoute } from "@/api/routes/public/plans";
import { publicUserRoute } from "@/api/routes/public/user";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoutes)
  .use(joinPostRoute)
  .use(hiscoresRoutes)
  .use(challengeRoutes)
  .use(publicUserRoute)
  .use(publicPlansRoute);
