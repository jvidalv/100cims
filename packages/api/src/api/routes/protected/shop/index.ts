import { Elysia } from "elysia";

import { couponLookupGetRoute } from "@/api/routes/protected/shop/coupon-lookup.get";
import { shopRequestPostRoute } from "@/api/routes/protected/shop/shop-request.post";

export const shopRoutes = new Elysia({ prefix: "/shop" })
  .use(shopRequestPostRoute)
  .use(couponLookupGetRoute);
