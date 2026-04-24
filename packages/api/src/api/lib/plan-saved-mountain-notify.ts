import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import { mountainTable, userSavedMountainTable } from "@/db/schema";

import { sendPushLocalized } from "./push";
import {
  pushPlanForSavedMountainBody,
  pushPlanForSavedMountainTitle,
} from "./push-translations";
import { getUserDisplayName, PUSH_TYPE } from "./push-types";

interface Args {
  planId: string;
  planTitle: string;
  creator: { id: string; firstName: string | null; username: string | null };
  mountainIds: string[];
}

export const notifyUsersWithSavedMountains = async ({
  planId,
  planTitle,
  creator,
  mountainIds,
}: Args) => {
  if (!mountainIds.length) return;

  try {
    const rows = await db
      .select({
        userId: userSavedMountainTable.userId,
        mountainId: userSavedMountainTable.mountainId,
        mountainName: mountainTable.name,
      })
      .from(userSavedMountainTable)
      .innerJoin(
        mountainTable,
        eq(mountainTable.id, userSavedMountainTable.mountainId),
      )
      .where(
        and(
          inArray(userSavedMountainTable.mountainId, mountainIds),
          ne(userSavedMountainTable.userId, creator.id),
        ),
      );

    // One push per user, keyed by the first matched mountain so its name
    // can headline the notification title.
    const seenUsers = new Set<string>();
    const byMountain = new Map<
      string,
      { mountainName: string; userIds: string[] }
    >();
    for (const r of rows) {
      if (seenUsers.has(r.userId)) continue;
      seenUsers.add(r.userId);
      const existing = byMountain.get(r.mountainId);
      if (existing) {
        existing.userIds.push(r.userId);
      } else {
        byMountain.set(r.mountainId, {
          mountainName: r.mountainName,
          userIds: [r.userId],
        });
      }
    }

    const creatorName = getUserDisplayName(creator);

    await Promise.allSettled(
      Array.from(byMountain.values()).map(({ mountainName, userIds }) =>
        sendPushLocalized(
          userIds,
          (locale) => ({
            title: pushPlanForSavedMountainTitle(locale, mountainName),
            body: pushPlanForSavedMountainBody(locale, creatorName, planTitle),
          }),
          { type: PUSH_TYPE.PLAN_SAVED_MOUNTAIN, planId },
        ),
      ),
    );
  } catch (err) {
    console.error("[plan-saved-mountain-notify] failed:", err);
  }
};
