import { t } from "elysia";

/**
 * Schema for a single hiscore entry with user stats
 */
export const HiscoreEntrySchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  summitsCount: t.String(),
  uniquePeaksCount: t.String(),
  essentialPeaksCount: t.String(),
  totalScore: t.Number(),
});

/**
 * Schema for array of hiscore entries
 */
export const HiscoresArraySchema = t.Array(HiscoreEntrySchema);

/**
 * Schema for paginated hiscores response
 */
export const PaginatedHiscoresSchema = t.Object({
  items: HiscoresArraySchema,
  pagination: t.Object({
    page: t.Number(),
    pageSize: t.Number(),
    totalItems: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
  }),
});
