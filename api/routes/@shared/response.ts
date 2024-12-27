import { t, TSchema } from "elysia";

export const response = (message: TSchema) =>
  t.Object({
    success: t.Boolean(),
    message: message,
  });
