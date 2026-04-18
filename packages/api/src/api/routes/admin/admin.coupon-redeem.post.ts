import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { couponRedemptionTable, couponTable, userTable } from "@/db/schema";
import { AdminCouponRedeemBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCouponRedeemPostRoute = new Elysia().post(
  "/coupon/:id/redeem",
  async ({ params, body, set }) => {
    const [coupon] = await db
      .select()
      .from(couponTable)
      .where(eq(couponTable.id, params.id));
    if (!coupon) {
      set.status = 404;
      return { error: "Coupon not found" };
    }
    if (!coupon.active) {
      set.status = 409;
      return { error: "Coupon is inactive." };
    }

    const [user] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.id, body.userId));
    if (!user) {
      set.status = 400;
      return { error: "User not found." };
    }

    if (coupon.maxUses !== null) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(couponRedemptionTable)
        .where(eq(couponRedemptionTable.couponId, coupon.id));
      if (count >= coupon.maxUses) {
        set.status = 409;
        return { error: "Coupon has reached its max uses." };
      }
    }

    if (coupon.onePerUser) {
      const [existing] = await db
        .select({ id: couponRedemptionTable.id })
        .from(couponRedemptionTable)
        .where(
          and(
            eq(couponRedemptionTable.couponId, coupon.id),
            eq(couponRedemptionTable.userId, body.userId),
          ),
        );
      if (existing) {
        set.status = 409;
        return { error: "This user has already redeemed this coupon." };
      }
    }

    const [row] = await db
      .insert(couponRedemptionTable)
      .values({
        couponId: coupon.id,
        userId: body.userId,
        note: body.note ?? null,
      })
      .returning({ id: couponRedemptionTable.id });

    return { success: true, message: { id: row.id } };
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminCouponRedeemBodySchema,
    response: {
      200: SuccessResponse(t.Object({ id: t.String() })),
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
