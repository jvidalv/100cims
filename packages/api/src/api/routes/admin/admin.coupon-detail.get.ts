import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { couponRedemptionTable, couponTable, userTable } from "@/db/schema";
import { AdminCouponDetailSchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCouponDetailGetRoute = new Elysia().get(
  "/coupon/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select()
      .from(couponTable)
      .where(eq(couponTable.id, params.id));
    if (!row) {
      set.status = 404;
      return { error: "Coupon not found" };
    }

    const redemptions = await db
      .select({
        id: couponRedemptionTable.id,
        userId: couponRedemptionTable.userId,
        userEmail: userTable.email,
        userFirstName: userTable.firstName,
        userLastName: userTable.lastName,
        note: couponRedemptionTable.note,
        redeemedAt: couponRedemptionTable.redeemedAt,
      })
      .from(couponRedemptionTable)
      .leftJoin(userTable, eq(userTable.id, couponRedemptionTable.userId))
      .where(eq(couponRedemptionTable.couponId, params.id))
      .orderBy(desc(couponRedemptionTable.redeemedAt));

    return {
      success: true,
      message: {
        ...row,
        redemptionCount: redemptions.length,
        redemptions,
      },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminCouponDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
