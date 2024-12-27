import { Elysia } from "elysia";
import { mountainsRoute } from "@/api/routes/public/mountains.route";
import { joinRoute } from "@/api/routes/public/join.route";

export const publicRoutes = new Elysia({ prefix: "/public" })
  .use(mountainsRoute)
  .use(joinRoute);
