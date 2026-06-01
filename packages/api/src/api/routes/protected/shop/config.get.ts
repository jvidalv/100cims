import { Elysia, t } from "elysia";

import { SuccessResponse } from "@/api/schemas/common.schema";

// Shop-wide config the mobile cart needs at runtime. Bizum phone lives
// here so we can change it without shipping a new app release — buyer
// just opens the cart and gets the new number on the next request. If
// we add more knobs later (max order amount, holiday banner) extend
// this same response.
const BIZUM_PHONE = "605628741";

export const shopConfigGetRoute = new Elysia().get(
  "/config",
  () => ({
    success: true,
    message: { bizumPhone: BIZUM_PHONE },
  }),
  {
    response: SuccessResponse(t.Object({ bizumPhone: t.String() })),
  },
);
