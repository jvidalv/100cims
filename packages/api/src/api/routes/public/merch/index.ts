import { Elysia } from "elysia";

import { merchAllGetRoute } from "@/api/routes/public/merch/merch.all.get";

export const publicMerchRoute = new Elysia({ prefix: "/merch" }).use(
  merchAllGetRoute,
);
