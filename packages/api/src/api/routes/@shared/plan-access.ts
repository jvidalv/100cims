import { and, eq, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "@/db";
import { planHasUsersTable, planTable } from "@/db/schema";

/**
 * SQL predicate: plan is visible to the given viewer (creator, member, or
 * public). Pass as an argument to `.where(...)` alongside other filters.
 */
export const planVisibilitySql = (viewerId: string | undefined): SQL => {
  const publicPredicate = eq(planTable.isPrivate, false);
  if (!viewerId) return publicPredicate;
  // `or(...)` is typed `SQL | undefined` to allow variadic undefined inputs;
  // every input here is concrete, so it never returns undefined — fall back
  // on the public predicate to satisfy TS without a runtime branch that
  // can't fire.
  return (
    or(
      publicPredicate,
      eq(planTable.creatorId, viewerId),
      sql`EXISTS (
        SELECT 1 FROM ${planHasUsersTable}
        WHERE ${planHasUsersTable.planId} = ${planTable.id}
          AND ${planHasUsersTable.userId} = ${viewerId}
      )`,
    ) ?? publicPredicate
  );
};

/**
 * Runtime check for a single plan. Use on routes that already loaded the plan
 * row and need to decide whether the viewer may read it.
 */
export const canReadPlan = async ({
  plan,
  viewerId,
}: {
  plan: { id: string; creatorId: string; isPrivate: boolean };
  viewerId: string | undefined;
}): Promise<boolean> => {
  if (!plan.isPrivate) return true;
  if (!viewerId) return false;
  if (plan.creatorId === viewerId) return true;

  const [member] = await db
    .select({ id: planHasUsersTable.planId })
    .from(planHasUsersTable)
    .where(
      and(
        eq(planHasUsersTable.planId, plan.id),
        eq(planHasUsersTable.userId, viewerId),
      ),
    )
    .limit(1);

  return Boolean(member);
};
