export const PLAN_STATUSES = ["open", "completed", "canceled"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_SPEEDS = ["chill", "normal", "fast"] as const;
export type PlanSpeed = (typeof PLAN_SPEEDS)[number];

export const COUPON_DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

export const SHOP_REQUEST_STATUSES = [
  "requested",
  "contacted",
  "done",
  "cancelled",
] as const;
export type ShopRequestStatus = (typeof SHOP_REQUEST_STATUSES)[number];
