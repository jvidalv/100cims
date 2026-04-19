import { Elysia } from "elysia";

import { createShopRequest } from "@/api/lib/shop-request";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ShopRequestCreateBodySchema,
  ShopRequestCreateResponseSchema,
} from "@/api/schemas/shop.schema";

export const shopRequestPostRoute = new Elysia().post(
  "/request",
  async ({ request, body }) => {
    const user = getUserFromRequest(request);
    const { id } = await createShopRequest({
      userId: user.id,
      userEmail: user.email,
      message: body.message,
    });
    return { success: true, id };
  },
  {
    body: ShopRequestCreateBodySchema,
    response: ShopRequestCreateResponseSchema,
  },
);
