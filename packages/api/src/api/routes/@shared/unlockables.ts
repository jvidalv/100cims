import { and, arrayContains, eq, not, sql } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import type { Unlockable } from "@/api/schemas/unlockables";

/**
 * Idempotently grant an unlockable to a user. The WHERE clause guards against
 * double-appends using drizzle's typed `arrayContains`; the SET uses
 * `array_append` via a localized `sql` fragment since drizzle has no typed
 * array-append helper. Safe against concurrent writers.
 *
 * Returns true if the unlock was applied, false if the user already had it
 * (or the user doesn't exist).
 */
export const unlockIcon = async (
  userId: string,
  key: Unlockable,
): Promise<boolean> => {
  const result = await db
    .update(userTable)
    .set({ unlockables: sql`array_append(${userTable.unlockables}, ${key})` })
    .where(
      and(
        eq(userTable.id, userId),
        not(arrayContains(userTable.unlockables, [key])),
      ),
    )
    .returning({ id: userTable.id });
  return result.length > 0;
};
