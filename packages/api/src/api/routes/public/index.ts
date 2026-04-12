import { Elysia } from "elysia";

import { challengeRoutes } from "@/api/routes/public/challenge";
import { contactPostRoute } from "@/api/routes/public/contact.post";
import { hiscoresRoutes } from "@/api/routes/public/hiscores";
import { joinPostRoute } from "@/api/routes/public/join.post";
import { logErrorPostRoute } from "@/api/routes/public/log-error.post";
import { mountainsRoutes } from "@/api/routes/public/mountains";
import { publicPlansRoute } from "@/api/routes/public/plans";
import { publicUserRoute } from "@/api/routes/public/user";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoutes)
  .use(joinPostRoute)
  .use(contactPostRoute)
  .use(logErrorPostRoute)
  .use(hiscoresRoutes)
  .use(challengeRoutes)
  .use(publicUserRoute)
  .use(publicPlansRoute);
