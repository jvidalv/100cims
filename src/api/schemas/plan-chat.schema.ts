import { t } from "elysia";

/**
 * Schema for basic message user info
 */
export const MessageUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

/**
 * Schema for a plan message
 */
export const PlanMessageSchema = t.Object({
  id: t.String(),
  message: t.String(),
  createdAt: t.Date(),
  user: MessageUserSchema,
});

/**
 * Schema for array of plan messages
 */
export const PlanMessagesArraySchema = t.Array(PlanMessageSchema);

/**
 * Schema for basic message without user
 */
export const BasicMessageSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  planId: t.String(),
  message: t.String(),
  createdAt: t.Date(),
});

/**
 * Schema for unread plan IDs response
 */
export const UnreadPlansSchema = t.Array(t.String());
