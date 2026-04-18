import { Elysia, t } from "elysia";

import { db } from "@/db";
import { couponTable } from "@/db/schema";
import { validateDiscount } from "@/api/lib/coupons";
import { AdminCouponCreateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCouponCreatePostRoute = new Elysia().post(
  "/coupon",
  async ({ body, set }) => {
    const check = validateDiscount(body.discountType, body.discountValue);
    if (!check.ok) {
      set.status = 400;
      return { error: check.error };
    }

    try {
      const [row] = await db
        .insert(couponTable)
        .values({
          code: body.code,
          discountType: body.discountType,
          discountValue: body.discountValue,
          maxUses: body.maxUses ?? null,
          onePerUser: body.onePerUser ?? false,
          active: body.active ?? true,
        })
        .returning({ id: couponTable.id });

      return { success: true, message: { id: row.id } };
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === "23505") {
        set.status = 409;
        return {
          error: `Conflict: ${err.constraint ?? "unique constraint"}`,
        };
      }
      throw e;
    }
  },
  {
    body: AdminCouponCreateBodySchema,
    response: {
      200: SuccessResponse(t.Object({ id: t.String() })),
      400: ErrorFieldResponse,
      409: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
