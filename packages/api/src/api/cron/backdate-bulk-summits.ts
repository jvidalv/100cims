import { sql } from "drizzle-orm";

import { db } from "@/db";
import { summitTable } from "@/db/schema";

const BATCH_THRESHOLD = 5;
const BACKDATE_YEARS = 5;
const LOOKBACK_DAYS = 7;

export async function backdateBulkSummits(): Promise<void> {
  const updated = await db.execute(sql`
    WITH bulk AS (
      SELECT user_id, summited_at
      FROM ${summitTable}
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(LOOKBACK_DAYS))} days'
        AND summited_at = (created_at AT TIME ZONE 'UTC')::date
      GROUP BY user_id, summited_at
      HAVING COUNT(*) >= ${BATCH_THRESHOLD}
    )
    UPDATE ${summitTable} AS s
    SET summited_at = s.summited_at - INTERVAL '${sql.raw(String(BACKDATE_YEARS))} years'
    FROM bulk b
    WHERE s.user_id = b.user_id
      AND s.summited_at = b.summited_at
      AND s.summited_at = (s.created_at AT TIME ZONE 'UTC')::date
    RETURNING s.id;
  `);

  // Catch any summits dated in the future relative to their creation date —
  // these can't be legitimate (you can't summit tomorrow) and slip past the
  // bulk-threshold check above when users log fewer than BATCH_THRESHOLD.
  const future = await db.execute(sql`
    UPDATE ${summitTable} AS s
    SET summited_at = s.summited_at - INTERVAL '${sql.raw(String(BACKDATE_YEARS))} years'
    WHERE summited_at > (created_at AT TIME ZONE 'UTC')::date
    RETURNING s.id;
  `);

  console.log(
    `[backdate-bulk-summits] backdated ${updated.length} bulk summit(s), ${future.length} future summit(s)`,
  );
}
