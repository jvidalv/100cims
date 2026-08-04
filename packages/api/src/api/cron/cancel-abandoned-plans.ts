import { and, eq, inArray, isNull, lt } from "drizzle-orm";

import { db } from "@/db";
import { planTable, userTable } from "@/db/schema";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function cancelAbandonedPlans(): Promise<void> {
  const cutoff = new Date(Date.now() - ONE_MONTH_MS);

  const candidates = await db
    .select({ id: planTable.id })
    .from(planTable)
    .innerJoin(userTable, eq(planTable.creatorId, userTable.id))
    .where(
      and(
        eq(planTable.status, "open"),
        isNull(planTable.startDate),
        lt(planTable.createdAt, cutoff),
        eq(userTable.admin, false),
        // Private plans are personal to-do lists rather than open
        // invitations, so leaving one dateless isn't abandonment.
        eq(planTable.isPrivate, false),
      ),
    );

  if (candidates.length === 0) {
    console.log("[cancel-abandoned-plans] nothing to cancel");
    return;
  }

  const updated = await db
    .update(planTable)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(
      inArray(
        planTable.id,
        candidates.map((c) => c.id),
      ),
    )
    .returning({ id: planTable.id });

  console.log(`[cancel-abandoned-plans] canceled ${updated.length} plan(s)`);
}
