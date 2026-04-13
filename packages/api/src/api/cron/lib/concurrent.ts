/**
 * Run async work on `items` with a hard cap on simultaneous in-flight tasks.
 * Necessary because Promise.all over a 1000-item S3 page would launch 1000
 * concurrent GET + sharp transforms — saturating libuv's thread pool and
 * peaking RAM at hundreds of MB on a 1-vCPU container.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return out;
}
