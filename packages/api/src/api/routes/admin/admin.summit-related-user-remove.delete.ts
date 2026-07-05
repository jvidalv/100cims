import { and, eq, ne } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitHasUsersTable, summitTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminSummitRelatedUserRemoveDeleteRoute = new Elysia().delete(
  "/summits/:id/related-users/:userId",
  async ({ params, set }) => {
    const removed = await db.transaction(async (tx) => {
      const [row] = await tx
        .delete(summitHasUsersTable)
        .where(
          and(
            eq(summitHasUsersTable.summitId, params.id),
            eq(summitHasUsersTable.userId, params.userId),
          ),
        )
        .returning({ id: summitHasUsersTable.id });

      if (!row) return false;

      // The summit's `userId` (main user) is always also a `summit_has_users`
      // member. Removing that member would leave `userId` dangling, so promote
      // another remaining member — or clear it when none are left.
      const [summit] = await tx
        .select({ userId: summitTable.userId })
        .from(summitTable)
        .where(eq(summitTable.id, params.id));

      if (summit?.userId === params.userId) {
        const [next] = await tx
          .select({ userId: summitHasUsersTable.userId })
          .from(summitHasUsersTable)
          .where(
            and(
              eq(summitHasUsersTable.summitId, params.id),
              ne(summitHasUsersTable.userId, params.userId),
            ),
          )
          .limit(1);

        await tx
          .update(summitTable)
          .set({ userId: next?.userId ?? null })
          .where(eq(summitTable.id, params.id));
      }

      return true;
    });

    if (!removed) {
      set.status = 404;
      return { error: "Related user not found on this summit" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String(), userId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
