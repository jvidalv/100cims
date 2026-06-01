import { Elysia, t } from "elysia";

import { SuccessResponse } from "@/api/schemas/common.schema";

// Shop-wide config the mobile cart needs at runtime. All knobs live
// here so we can change them without shipping a new app release —
// buyer just opens the cart and the next request sees the new values.
// Add more (max order amount, holiday banner) by extending this same
// response.
const BIZUM_PHONE = "605628741";
// Flat shipping fee in euros, charged when the cart subtotal (goods
// total before any coupon) is below `FREE_SHIPPING_THRESHOLD_EUROS`.
// Set to 0 to disable shipping fees entirely.
const SHIPPING_FEE_EUROS = 5;
// Subtotal (goods total pre-coupon) at or above which shipping is free.
// We deliberately key off the pre-coupon subtotal so a coupon can't
// push the buyer below the free-shipping bar.
const FREE_SHIPPING_THRESHOLD_EUROS = 50;

export const shopConfigGetRoute = new Elysia().get(
  "/config",
  () => ({
    success: true,
    message: {
      bizumPhone: BIZUM_PHONE,
      shippingFee: SHIPPING_FEE_EUROS,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD_EUROS,
    },
  }),
  {
    response: SuccessResponse(
      t.Object({
        bizumPhone: t.String(),
        shippingFee: t.Number(),
        freeShippingThreshold: t.Number(),
      }),
    ),
  },
);
