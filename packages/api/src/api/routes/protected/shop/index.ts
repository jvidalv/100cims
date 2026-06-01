import { Elysia } from "elysia";

import { shopConfigGetRoute } from "@/api/routes/protected/shop/config.get";
import { couponLookupGetRoute } from "@/api/routes/protected/shop/coupon-lookup.get";
import { shopRequestPaymentPostRoute } from "@/api/routes/protected/shop/shop-request-payment.post";
import { shopRequestPostRoute } from "@/api/routes/protected/shop/shop-request.post";

export const shopRoutes = new Elysia({ prefix: "/shop" })
  .use(shopRequestPostRoute)
  .use(couponLookupGetRoute)
  .use(shopRequestPaymentPostRoute)
  .use(shopConfigGetRoute);
