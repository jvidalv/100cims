import type { CouponDiscountType } from "@/db/enums";

// Percent coupons cap at 99% (100% would mean "free", which is a different
// business decision and a footgun for accidental BOGO-style mistakes); fixed-€
// coupons only require >=1 since the upper bound is the item price at checkout.
export const validateDiscount = (
  type: CouponDiscountType,
  value: number,
): { ok: true } | { ok: false; error: string } => {
  if (value < 1) {
    return { ok: false, error: "Discount value must be at least 1." };
  }
  if (type === "percentage" && value > 99) {
    return {
      ok: false,
      error: "Percentage discounts must be between 1 and 99.",
    };
  }
  return { ok: true };
};
