import { Elysia } from "elysia";

import { userChallengesGetRoute } from "@/api/routes/public/user/user.challenges.get";
import { userOneGetRoute } from "@/api/routes/public/user/user.one.get";
import { userSummitsAllGetRoute } from "@/api/routes/public/user/user.summits.all.get";
import { userSummitsGetRoute } from "@/api/routes/public/user/user.summits.get";
import { userUserProfileGetRoute } from "@/api/routes/public/user/user.user-profile.get";

export const publicUserRoute = new Elysia({ prefix: "/user" })
  .use(userOneGetRoute)
  .use(userSummitsGetRoute)
  .use(userSummitsAllGetRoute)
  .use(userUserProfileGetRoute)
  .use(userChallengesGetRoute);
