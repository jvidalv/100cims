import { t } from "elysia";

export const ShopRequestCreateBodySchema = t.Object({
  message: t.String({ minLength: 1, maxLength: 5000 }),
});

export const ShopRequestCreateResponseSchema = t.Object({
  success: t.Boolean(),
  id: t.String(),
});
