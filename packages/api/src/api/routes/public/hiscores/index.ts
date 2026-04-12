import { Elysia } from "elysia";

import { hiscoresAllGetRoute } from "@/api/routes/public/hiscores/hiscores.all.get";

export const hiscoresRoutes = new Elysia({ prefix: "/hiscores" }).use(
  hiscoresAllGetRoute,
);
