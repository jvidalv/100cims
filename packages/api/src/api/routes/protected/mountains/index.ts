import { Elysia } from "elysia";

import { JWT } from "@/api/routes/@shared/jwt";
import { myListRoute } from "./my-list.route";
import { updateMountainRoute } from "./update.route";
import { summitMountainRoute } from "./summit.route";

export const mountainsRoute = new Elysia({
  prefix: "/mountains",
})
  .use(JWT())
  .use(myListRoute)
  .use(updateMountainRoute)
  .use(summitMountainRoute);
