import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { PLAN_STATUSES } from "@/db/enums";
import { planHasUsersTable, planTable } from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import { pushPlanReminder } from "@/api/lib/push-translations";
import { PUSH_TYPE } from "@/api/lib/push-types";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const REMINDABLE_STATUSES = PLAN_STATUSES.filter((s) => s !== "canceled");

export async function notifyUpcomingPlans(): Promise<void> {
  const target = new Date(Date.now() + TWO_DAYS_MS).toISOString().slice(0, 10);

  const plans = await db
    .select({ id: planTable.id, title: planTable.title })
    .from(planTable)
    .where(
      and(
        eq(planTable.startDate, target),
        inArray(planTable.status, REMINDABLE_STATUSES),
      ),
    );

  if (plans.length === 0) {
    console.log("[notify-upcoming-plans] no plans matched");
    return;
  }

  const planIds = plans.map((p) => p.id);
  const rosters = await db
    .select({
      planId: planHasUsersTable.planId,
      userId: planHasUsersTable.userId,
    })
    .from(planHasUsersTable)
    .where(inArray(planHasUsersTable.planId, planIds));

  const byPlan = new Map<string, string[]>();
  for (const r of rosters) {
    const list = byPlan.get(r.planId) ?? [];
    list.push(r.userId);
    byPlan.set(r.planId, list);
  }

  const sends = plans.flatMap((plan) => {
    const recipients = byPlan.get(plan.id) ?? [];
    if (!recipients.length) return [];
    return [
      sendPushLocalized(
        recipients,
        (locale) => ({
          title: plan.title,
          body: pushPlanReminder(locale),
        }),
        { type: PUSH_TYPE.PLAN_REMINDER, planId: plan.id },
      ),
    ];
  });

  const results = await Promise.allSettled(sends);
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(
    `[notify-upcoming-plans] pinged ${sends.length}/${plans.length} plan(s)` +
      (failed ? `, ${failed} failed` : ""),
  );
}
