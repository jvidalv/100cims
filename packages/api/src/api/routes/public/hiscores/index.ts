import { Elysia } from "elysia";

import { allRoute } from "@/api/routes/public/hiscores/all.route";

export const hiscoresRoutes = new Elysia({ prefix: "/hiscores" }).use(allRoute);
