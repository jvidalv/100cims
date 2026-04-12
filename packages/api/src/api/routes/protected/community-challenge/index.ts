import { Elysia } from "elysia";

import { challengeCreatePostRoute } from "./challenge.create.post";
import { challengeDeletePostRoute } from "./challenge.delete.post";
import { challengeDetailGetRoute } from "./challenge.detail.get";
import { challengeListGetRoute } from "./challenge.list.get";
import { challengeSearchMountainsGetRoute } from "./challenge.search-mountains.get";
import { challengeUpdatePostRoute } from "./challenge.update.post";

export const communityChallengeRoute = new Elysia({
  prefix: "/community-challenge",
})
  .use(challengeCreatePostRoute)
  .use(challengeListGetRoute)
  .use(challengeDetailGetRoute)
  .use(challengeUpdatePostRoute)
  .use(challengeDeletePostRoute)
  .use(challengeSearchMountainsGetRoute);
