/**
 * Format a cached rating aggregate for the admin UI.
 * Returns "—" when the average is null (no ratings on that axis).
 * With `withCount: true`, appends "(N)".
 */
export const formatRating = (
  avg: number | null,
  count: number,
  { withCount = false }: { withCount?: boolean } = {},
): string => {
  if (avg == null) return "—";
  const base = avg.toFixed(1);
  return withCount ? `${base} (${count})` : base;
};
