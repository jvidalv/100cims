import { eq, inArray, isNull } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { summitHasUsersTable, summitTable, userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const deleteRoute = new Elysia().use(JWT()).get(
  "/delete",
  async ({ store, set }) => {
    const user = getStoreUser(store);

    const result = await db.transaction(async (tx) => {
      const deletedUser = await tx
        .delete(userTable)
        .where(eq(userTable.id, user.id))
        .returning();

      if (!deletedUser.length) {
        return { error: true };
      }

      // Query to find all `summitTable` entries without corresponding `summitHasUsersTable` entries
      const orphanedSummits = await tx
        .select({ id: summitTable.id })
        .from(summitTable)
        .leftJoin(
          summitHasUsersTable,
          eq(summitTable.id, summitHasUsersTable.summitId),
        )
        .where(isNull(summitHasUsersTable.id));

      const orphanedSummitIds = orphanedSummits.map((summit) => summit.id);
      if (orphanedSummitIds.length > 0) {
        await tx
          .delete(summitTable)
          .where(inArray(summitTable.id, orphanedSummitIds));
      }

      return { success: true };
    });

    if ("error" in result) {
      set.status = 500;
      return { error: true };
    }

    return {
      success: true,
    };
  },
  {
    response: {
      200: SimpleSuccessResponse,
      500: ErrorFieldResponse,
    },
  },
);
