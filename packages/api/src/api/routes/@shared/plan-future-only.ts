import { gte } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { planTable } from "@/db/schema";

/**
 * SQL predicate for the `futureOnly` query param shared by the public plan
 * list endpoints (`/plans/all`, `/plans/all-paginated`, `/plans/featured`).
 *
 * When the flag is truthy, returns a `gte(startDate, today)` filter that
 * drops past plans. Plans with a null `startDate` fall out naturally
 * because `NULL >= 'YYYY-MM-DD'` is NULL/false in SQL.
 *
 * When the flag is falsy / absent, returns `undefined` so the caller can
 * drop it from a `.filter(Boolean)` chain.
 *
 * Boundary: `>= today` is forgiving — a plan dated today is still considered
 * "upcoming" until the next nightly run of the `complete-stale-plans` cron
 * marks it completed (~24h after its date).
 *
 * Date computation: `new Date().toISOString().slice(0, 10)` returns today's
 * date in UTC, NOT the server's wall-clock tz. For the Cims app (Spain,
 * UTC+1/+2) this only matters in the 0:00-02:00 Spain window where UTC is
 * still on the previous day; the effect is benign (we'd briefly include
 * yesterday's plan, never accidentally exclude tomorrow's). If you need
 * strict Europe/Madrid semantics, format with `Intl.DateTimeFormat` here.
 */
export const planFutureOnlySql = (
  futureOnly: boolean | undefined,
): SQL | undefined => {
  if (!futureOnly) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  return gte(planTable.startDate, today);
};
