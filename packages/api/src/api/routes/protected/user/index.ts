import { Elysia } from "elysia";

import { userAllGetRoute } from "@/api/routes/protected/user/user.all.get";
import { userDeleteGetRoute } from "@/api/routes/protected/user/user.delete.get";
import { userMarkUpdateSeenPostRoute } from "@/api/routes/protected/user/user.mark-update-seen.post";
import { userMeGetRoute } from "@/api/routes/protected/user/user.me.get";
import { userMePostRoute } from "@/api/routes/protected/user/user.me.post";
import { userPeopleGetRoute } from "@/api/routes/protected/user/user.people.get";
import { userPushTokenPostRoute } from "@/api/routes/protected/user/user.push-token.post";
import { userSuggestionPostRoute } from "@/api/routes/protected/user/user.suggestion.post";
import { userSummitsGetRoute } from "@/api/routes/protected/user/user.summits.get";
import { userSummitsAllGetRoute } from "@/api/routes/protected/user/user.summits.all.get";
import { userUnseenUpdatesGetRoute } from "@/api/routes/protected/user/user.unseen-updates.get";

export const userRoute = new Elysia({ prefix: "/user" })
  .use(userMeGetRoute)
  .use(userMePostRoute)
  .use(userPushTokenPostRoute)
  .use(userSummitsGetRoute)
  .use(userPeopleGetRoute)
  .use(userSummitsAllGetRoute)
  .use(userAllGetRoute)
  .use(userDeleteGetRoute)
  .use(userSuggestionPostRoute)
  .use(userUnseenUpdatesGetRoute)
  .use(userMarkUpdateSeenPostRoute);
