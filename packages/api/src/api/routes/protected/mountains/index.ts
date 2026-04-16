import { Elysia } from "elysia";

import { mountainDeletePostRoute } from "./mountain.delete.post";
import { mountainMyListGetRoute } from "./mountain.my-list.get";
import { mountainSummitPostRoute } from "./mountain.summit.post";
import { mountainUpdatePostRoute } from "./mountain.update.post";

export const mountainsRoute = new Elysia({
  prefix: "/mountains",
})
  .use(mountainMyListGetRoute)
  .use(mountainUpdatePostRoute)
  .use(mountainDeletePostRoute)
  .use(mountainSummitPostRoute);
