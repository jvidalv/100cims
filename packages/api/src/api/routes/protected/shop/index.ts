import { Elysia } from "elysia";

import { shopRequestPostRoute } from "@/api/routes/protected/shop/shop-request.post";

export const shopRoutes = new Elysia({ prefix: "/shop" }).use(
  shopRequestPostRoute,
);
