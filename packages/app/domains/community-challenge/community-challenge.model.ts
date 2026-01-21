/**
 * Check if the current user is the creator of a community challenge
 */
export const isCreator = (
  creatorId: string | null | undefined,
  userId: string | undefined
): boolean => {
  if (!creatorId || !userId) return false;
  return creatorId === userId;
};

/**
 * Format mountain count for display
 */
export const formatMountainCount = (count: string | number): string => {
  const num = typeof count === "string" ? parseInt(count, 10) : count;
  return num.toString();
};
