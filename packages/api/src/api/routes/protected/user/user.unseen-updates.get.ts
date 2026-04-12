import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { updateSeenTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UnseenUpdatesResponseSchema } from "@/api/schemas/update.schema";

export const userUnseenUpdatesGetRoute = new Elysia().get(
  "/unseen-updates",
  async ({ request, query }) => {
    const user = getUserFromRequest(request);

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
