import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { updateSeenTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UnseenUpdatesResponseSchema } from "@/api/schemas/update.schema";

export const unseenUpdatesRoute = new Elysia().use(JWT()).get(
  "/unseen-updates",
  async ({ store, query }) => {
    const user = getStoreUser(store);

    // Parse comma-separated update IDs from query param
    const updateIds = query.updateIds
      ? query.updateIds.split(",").filter(Boolean)
      : [];

    if (updateIds.length === 0) {
      return {
        success: true,
        message: [],
      };
    }

    // Get all update IDs this user has already seen
    const seenUpdates = await db
      .select({ updateId: updateSeenTable.updateId })
      .from(updateSeenTable)
      .where(eq(updateSeenTable.userId, user.id));

    const seenUpdateIds = seenUpdates.map((s) => s.updateId);

    // Filter to only unseen updates
    const unseenUpdateIds = updateIds.filter(
      (id) => !seenUpdateIds.includes(id),
    );

    return {
      success: true,
      message: unseenUpdateIds,
    };
  },
  {
    query: t.Object({
      updateIds: t.String(), // Comma-separated list of update IDs
    }),
    response: SuccessResponse(UnseenUpdatesResponseSchema),
  },
);
