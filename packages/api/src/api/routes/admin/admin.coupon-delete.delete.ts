import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { couponTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCouponDeleteDeleteRoute = new Elysia().delete(
  "/coupon/:id",
  async ({ params, set }) => {
    // coupon_redemption.coupon_id has ON DELETE CASCADE, so redemptions go too.
    const [row] = await db
      .delete(couponTable)
      .where(eq(couponTable.id, params.id))
      .returning({ id: couponTable.id });
    if (!row) {
      set.status = 404;
      return { error: "Coupon not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
