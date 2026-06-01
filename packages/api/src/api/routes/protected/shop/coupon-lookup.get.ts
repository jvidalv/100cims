import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { couponRedemptionTable, couponTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { CouponDiscountTypeSchema } from "@/api/schemas/enums";

// Mobile clients call this on every coupon-code change in the cart to
// preview the discount before submit. We answer with `valid: false`
// rather than 4xx for any "code doesn't unlock a discount" case
// (unknown, inactive, maxed out, already redeemed by this user when
// onePerUser) — that way the client can render a single inline error
// state without distinguishing 404 vs 409.
export const couponLookupGetRoute = new Elysia().get(
  "/coupon-lookup",
  async ({ query, request }) => {
    const code = query.code.trim();
    if (!code) {
      return { success: true, message: { valid: false } };
    }

    const user = getUserFromRequest(request);

    // Case-insensitive match: codes are stored display-cased but the
    // unique index in the migration is on LOWER(code), so we look up
    // with LOWER() too.
    const [coupon] = await db
      .select()
      .from(couponTable)
      .where(sql`lower(${couponTable.code}) = lower(${code})`);
    if (!coupon || !coupon.active) {
      return { success: true, message: { valid: false } };
    }

    if (coupon.maxUses !== null) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(couponRedemptionTable)
        .where(eq(couponRedemptionTable.couponId, coupon.id));
      if (count >= coupon.maxUses) {
        return { success: true, message: { valid: false } };
      }
    }

    if (coupon.onePerUser) {
      const [existing] = await db
        .select({ id: couponRedemptionTable.id })
        .from(couponRedemptionTable)
        .where(
          and(
            eq(couponRedemptionTable.couponId, coupon.id),
            eq(couponRedemptionTable.userId, user.id),
          ),
        );
      if (existing) {
        return { success: true, message: { valid: false } };
      }
    }

    return {
      success: true,
      message: {
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    };
  },
  {
    query: t.Object({ code: t.String() }),
    response: {
      200: SuccessResponse(
        t.Union([
          t.Object({ valid: t.Literal(false) }),
          t.Object({
            valid: t.Literal(true),
            code: t.String(),
            discountType: CouponDiscountTypeSchema,
            discountValue: t.Integer(),
          }),
        ]),
      ),
    },
  },
);
