// Single source of truth for the cart receipt math. Every surface that
// shows an amount — the inline summary above "Send order", the floating
// footer, the Bizum payment screen, the Discord `[MERCH ORDER]`
// message, the order-success card — reads from the same
// `computeCartTotals(...)` result. Inline arithmetic in cart.tsx /
// help.tsx / Bizum step is forbidden so we never get a strikethrough,
// receipt, and Bizum value that disagree about what the buyer pays.

export type AppliedCoupon = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
};

export type CartTotalsInput = {
  /** Goods value pre-coupon, pre-shipping. Sum of (line.unitPrice × qty). */
  subtotal: number;
  /** Resolved coupon or `null` when none / invalid. */
  appliedCoupon: AppliedCoupon | null;
  /** Flat shipping fee in euros from the server config. `0` disables. */
  shippingFee: number;
  /**
   * Subtotal (pre-coupon!) at or above which shipping is free. Use
   * `Infinity` to never offer free shipping.
   */
  freeShippingThreshold: number;
};

export type CartTotals = {
  subtotal: number;
  discountAmount: number;
  /** Goods value after coupon, clamped at 0. Useful for receipts. */
  goodsAfterCoupon: number;
  /** What the buyer is actually charged for shipping this time. */
  shippingCharge: number;
  /**
   * True only when the shop charges shipping AND this particular cart
   * cleared the threshold. UI conditions on this for the "Free" pill
   * and the "Free shipping unlocked." text.
   */
  isFreeShipping: boolean;
  /** What the buyer pays — `goodsAfterCoupon + shippingCharge`. */
  finalTotal: number;
  /**
   * What the buyer would have paid without the coupon, i.e. subtotal +
   * shippingCharge. Drives the struck-through "before" price next to
   * `finalTotal`. Equal to `finalTotal` when no coupon applied.
   */
  totalWithoutCoupon: number;
};

// Snap to 2 decimals so `25 × 0.85 = 21.25` doesn't render as
// `21.249999…`. Percentage discounts can produce fractional cents;
// fixed-€ discounts won't but the same formatter handles both.
export const round2 = (n: number): number => Math.round(n * 100) / 100;

export const computeCartTotals = ({
  subtotal,
  appliedCoupon,
  shippingFee,
  freeShippingThreshold,
}: CartTotalsInput): CartTotals => {
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? round2((subtotal * appliedCoupon.discountValue) / 100)
      : Math.min(subtotal, appliedCoupon.discountValue)
    : 0;
  const goodsAfterCoupon = Math.max(0, round2(subtotal - discountAmount));
  const shippingCharge = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const isFreeShipping = shippingFee > 0 && shippingCharge === 0;
  const finalTotal = round2(goodsAfterCoupon + shippingCharge);
  const totalWithoutCoupon = round2(subtotal + shippingCharge);

  return {
    subtotal,
    discountAmount,
    goodsAfterCoupon,
    shippingCharge,
    isFreeShipping,
    finalTotal,
    totalWithoutCoupon,
  };
};
