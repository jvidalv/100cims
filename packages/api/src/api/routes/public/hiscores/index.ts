import { Elysia } from "elysia";

import { hiscoresAllGetRoute } from "@/api/routes/public/hiscores/hiscores.all.get";
import { hiscoresAroundMeGetRoute } from "@/api/routes/public/hiscores/hiscores.around-me.get";

export const hiscoresRoutes = new Elysia({ prefix: "/hiscores" })
  .use(hiscoresAllGetRoute)
  .use(hiscoresAroundMeGetRoute);
