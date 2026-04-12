import { eq, inArray, isNull } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { summitHasUsersTable, summitTable, userTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const userDeleteGetRoute = new Elysia().get(
  "/delete",
  async ({ request, set }) => {
    const user = getUserFromRequest(request);

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
