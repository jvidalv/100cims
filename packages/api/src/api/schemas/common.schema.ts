import { t, TSchema } from "elysia";

/**
 * Standard success response wrapper: { success: true, message: T }
 */
export const SuccessResponse = <T extends TSchema>(messageSchema: T) =>
  t.Object({
    success: t.Boolean(),
    message: messageSchema,
  });

/**
 * Error response with message: { success: false, message: string }
 */
export const ErrorResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

/**
 * Simple success response: { success: true }
 */
export const SimpleSuccessResponse = t.Object({
  success: t.Boolean(),
});

/**
 * Error response with error field: { error: string | boolean }
 */
export const ErrorFieldResponse = t.Object({
  error: t.Union([t.String(), t.Boolean()]),
});
