import { and, eq, lt } from "drizzle-orm";

import { db } from "@/db";
import { planTable } from "@/db/schema";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export async function completeStalePlans(): Promise<void> {
  const cutoff = new Date(Date.now() - TWO_DAYS_MS).toISOString();

  const updated = await db
    .update(planTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(eq(planTable.status, "open"), lt(planTable.startDate, cutoff)),
    )
    .returning({ id: planTable.id });

  console.log(`[complete-stale-plans] completed ${updated.length} plan(s)`);
}
