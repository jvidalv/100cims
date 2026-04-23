import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, userSavedMountainTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";

const SavedMountainSchema = t.Object({
  mountainId: t.String(),
  slug: t.String(),
  name: t.String(),
  location: t.String(),
  height: t.String(),
  imageUrl: t.Nullable(t.String()),
  savedAt: t.Date(),
});

export const userSavedGetRoute = new Elysia().get(
  "/saved",
  async ({ request }) => {
    const user = getUserFromRequest(request);

    const rows = await db
      .select({
        mountainId: mountainTable.id,
        slug: mountainTable.slug,
        name: mountainTable.name,
        location: mountainTable.location,
        height: mountainTable.height,
        imageUrl: mountainTable.imageUrl,
        savedAt: userSavedMountainTable.createdAt,
      })
      .from(userSavedMountainTable)
      .innerJoin(
        mountainTable,
        eq(mountainTable.id, userSavedMountainTable.mountainId),
      )
      .where(eq(userSavedMountainTable.userId, user.id))
      .orderBy(desc(userSavedMountainTable.createdAt));

    return { success: true, message: rows };
  },
  {
    response: SuccessResponse(t.Array(SavedMountainSchema)),
  },
);
