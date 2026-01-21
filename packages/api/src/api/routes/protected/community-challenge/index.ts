import { Elysia } from "elysia";

import { JWT } from "@/api/routes/@shared/jwt";
import { createRoute } from "./create.route";
import { deleteRoute } from "./delete.route";
import { detailRoute } from "./detail.route";
import { listRoute } from "./list.route";
import { searchMountainsRoute } from "./search-mountains.route";
import { updateRoute } from "./update.route";

export const communityChallengeRoute = new Elysia({
  prefix: "/community-challenge",
})
  .use(JWT())
  .use(createRoute)
  .use(listRoute)
  .use(detailRoute)
  .use(updateRoute)
  .use(deleteRoute)
  .use(searchMountainsRoute);
