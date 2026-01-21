import { Elysia } from "elysia";

import { allRoute } from "@/api/routes/protected/user/all.route";
import { deleteRoute } from "@/api/routes/protected/user/delete.route";
import { markUpdateSeenRoute } from "@/api/routes/protected/user/mark-update-seen.route";
import { meGetRoute } from "@/api/routes/protected/user/me-get.route";
import { mePostRoute } from "@/api/routes/protected/user/me-post.route";
import { suggestionRoute } from "@/api/routes/protected/user/suggestion.route";
import { summitsRoute } from "@/api/routes/protected/user/summits.route";
import { unseenUpdatesRoute } from "@/api/routes/protected/user/unseen-updates.route";

export const userRoute = new Elysia({ prefix: "/user" })
  .use(meGetRoute)
  .use(mePostRoute)
  .use(summitsRoute)
  .use(allRoute)
  .use(deleteRoute)
  .use(suggestionRoute)
  .use(unseenUpdatesRoute)
  .use(markUpdateSeenRoute);
