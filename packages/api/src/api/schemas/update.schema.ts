import { t } from "elysia";

export const UnseenUpdatesResponseSchema = t.Array(t.String());

export const MarkUpdateSeenBodySchema = t.Object({
  updateId: t.String(),
});
