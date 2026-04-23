import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, userSavedMountainTable } from "@/db/schema";
import { AdminSavedMountainSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminUserSavedGetRoute = new Elysia().get(
  "/users/:id/saved",
  async ({ params }) => {
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
      .where(eq(userSavedMountainTable.userId, params.id))
      .orderBy(desc(userSavedMountainTable.createdAt));

    return { success: true, message: rows };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(t.Array(AdminSavedMountainSchema)),
  },
);
