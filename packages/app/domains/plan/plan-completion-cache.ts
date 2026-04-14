const cache = new Map<string, Record<string, string>>();

export const stashPlanCompletionImages = (
  planId: string,
  images: Record<string, string>,
) => {
  cache.set(planId, images);
};

export const consumePlanCompletionImages = (planId: string) => {
  const value = cache.get(planId);
  cache.delete(planId);
  return value ?? {};
};
