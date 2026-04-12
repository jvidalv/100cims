import { Elysia } from "elysia";

import { challengeActiveGetRoute } from "@/api/routes/public/challenge/challenge.active.get";
import { challengeAllGetRoute } from "@/api/routes/public/challenge/challenge.all.get";
import { challengeDetailGetRoute } from "@/api/routes/public/challenge/challenge.detail.get";

export const challengeRoutes = new Elysia({ prefix: "/challenge" })
  .use(challengeActiveGetRoute)
  .use(challengeAllGetRoute)
  .use(challengeDetailGetRoute);
