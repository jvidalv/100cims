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

/**
 * Paginated list wrapper: { items: T[], pagination: {...} }
 */
export const PaginatedSchema = <T extends TSchema>(itemSchema: T) =>
  t.Object({
    items: t.Array(itemSchema),
    pagination: t.Object({
      page: t.Number(),
      pageSize: t.Number(),
      totalItems: t.Number(),
      totalPages: t.Number(),
      hasMore: t.Boolean(),
    }),
  });
