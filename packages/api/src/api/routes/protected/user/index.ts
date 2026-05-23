import { Elysia } from "elysia";

import { userAllGetRoute } from "@/api/routes/protected/user/user.all.get";
import { userCalendarGetRoute } from "@/api/routes/protected/user/user.calendar.get";
import { userDeleteGetRoute } from "@/api/routes/protected/user/user.delete.get";
import { userMarkUpdateSeenPostRoute } from "@/api/routes/protected/user/user.mark-update-seen.post";
import { userMeGetRoute } from "@/api/routes/protected/user/user.me.get";
import { userMePostRoute } from "@/api/routes/protected/user/user.me.post";
import { userPeopleAddPostRoute } from "@/api/routes/protected/user/user.people-add.post";
import { userPeopleRemoveDeleteRoute } from "@/api/routes/protected/user/user.people-remove.delete";
import { userPeopleGetRoute } from "@/api/routes/protected/user/user.people.get";
import { userPushTokenPostRoute } from "@/api/routes/protected/user/user.push-token.post";
import { userSavedAddPostRoute } from "@/api/routes/protected/user/user.saved-add.post";
import { userSavedRemoveDeleteRoute } from "@/api/routes/protected/user/user.saved-remove.delete";
import { userSavedGetRoute } from "@/api/routes/protected/user/user.saved.get";
import { userSuggestionPostRoute } from "@/api/routes/protected/user/user.suggestion.post";
import { userSummitsGetRoute } from "@/api/routes/protected/user/user.summits.get";
import { userSummitsAllGetRoute } from "@/api/routes/protected/user/user.summits.all.get";
import { userSummitsExportGetRoute } from "@/api/routes/protected/user/user.summits.export.get";
import { userUnlockablesPostRoute } from "@/api/routes/protected/user/user.unlockables.post";
import { userUnseenUpdatesGetRoute } from "@/api/routes/protected/user/user.unseen-updates.get";

export const userRoute = new Elysia({ prefix: "/user" })
  .use(userMeGetRoute)
  .use(userMePostRoute)
  .use(userPushTokenPostRoute)
  .use(userSummitsGetRoute)
  .use(userPeopleGetRoute)
  .use(userPeopleAddPostRoute)
  .use(userPeopleRemoveDeleteRoute)
  .use(userSavedGetRoute)
  .use(userSavedAddPostRoute)
  .use(userSavedRemoveDeleteRoute)
  .use(userSummitsAllGetRoute)
  .use(userSummitsExportGetRoute)
  .use(userCalendarGetRoute)
  .use(userAllGetRoute)
  .use(userDeleteGetRoute)
  .use(userSuggestionPostRoute)
  .use(userUnseenUpdatesGetRoute)
  .use(userMarkUpdateSeenPostRoute)
  .use(userUnlockablesPostRoute);
