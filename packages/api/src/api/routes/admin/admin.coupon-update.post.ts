import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { couponTable } from "@/db/schema";
import { validateDiscount } from "@/api/lib/coupons";
import { AdminCouponUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminCouponUpdatePostRoute = new Elysia().post(
  "/coupon/:id",
  async ({ params, body, set }) => {
    try {
      if (body.discountType !== undefined || body.discountValue !== undefined) {
        if (
          body.discountType === undefined ||
          body.discountValue === undefined
        ) {
          set.status = 400;
          return {
            error:
              "Changing discount requires sending both discountType and discountValue.",
          };
        }
        const check = validateDiscount(body.discountType, body.discountValue);
        if (!check.ok) {
          set.status = 400;
          return { error: check.error };
        }
      }

      const [row] = await db
        .update(couponTable)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(couponTable.id, params.id))
        .returning({ id: couponTable.id });

      if (!row) {
        set.status = 404;
        return { error: "Coupon not found" };
      }
      return { success: true };
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
    params: t.Object({ id: t.String() }),
    body: AdminCouponUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
      500: ErrorFieldResponse,
    },
  },
);
