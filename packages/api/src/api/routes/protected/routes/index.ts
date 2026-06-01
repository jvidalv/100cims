import { Elysia } from "elysia";

import { routeListGetRoute } from "@/api/routes/protected/routes/route.list.get";
import { routeOneGetRoute } from "@/api/routes/protected/routes/route.one.get";

export const protectedRoutesRoute = new Elysia({ prefix: "/routes" })
  .use(routeListGetRoute)
  .use(routeOneGetRoute);
