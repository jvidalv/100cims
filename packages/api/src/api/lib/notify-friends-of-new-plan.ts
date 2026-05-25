import { eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { userPeopleTable } from "@/db/schema";

import { sendPushLocalized } from "./push";
import { pushFriendPlanCreated } from "./push-translations";
import { getUserDisplayName, PUSH_TYPE } from "./push-types";

interface Args {
  planId: string;
  planTitle: string;
  creator: { id: string; firstName: string | null; username: string | null };
  /** Participant IDs already added to the plan — skip notifying them since
   *  they'll get a participant-flavored notification (or are the creator). */
  excludeUserIds?: string[];
}

/**
 * Push every friend of `creator` a "your friend just created a plan" notice.
 * Friendships in `user_people` are stored as a single bidirectional row with
 * `userAId < userBId`, so we union both sides and take the *other* user id.
 */
export const notifyFriendsOfNewPlan = async ({
  planId,
  planTitle,
  creator,
  excludeUserIds = [],
}: Args) => {
  try {
    const exclude = new Set<string>([creator.id, ...excludeUserIds]);

    const rows = await db
      .select({
        friendId: sql<string>`
          CASE
            WHEN ${userPeopleTable.userAId} = ${creator.id}
              THEN ${userPeopleTable.userBId}
            ELSE ${userPeopleTable.userAId}
          END
        `.as("friend_id"),
      })
      .from(userPeopleTable)
      .where(
        or(
          eq(userPeopleTable.userAId, creator.id),
          eq(userPeopleTable.userBId, creator.id),
        ),
      );

    const friendIds = Array.from(
      new Set(rows.map((r) => r.friendId).filter((id) => !exclude.has(id))),
    );

    if (!friendIds.length) return;

    const creatorName = getUserDisplayName(creator);

    await sendPushLocalized(
      friendIds,
      (locale) => ({
        title: planTitle,
        body: pushFriendPlanCreated(locale, creatorName),
      }),
      { type: PUSH_TYPE.FRIEND_PLAN_CREATED, planId },
    );
  } catch (err) {
    console.error("[notify-friends-of-new-plan] failed:", err);
  }
};
