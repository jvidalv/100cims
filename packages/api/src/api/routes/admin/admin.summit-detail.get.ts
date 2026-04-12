import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { AdminSummitDetailSchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminSummitDetailGetRoute = new Elysia().get(
  "/summits/:id",
  async ({ params, set }) => {
    const [rows, relatedRows] = await Promise.all([
      db
        .select({
          id: summitTable.id,
          imageUrl: summitTable.imageUrl,
          summitedAt: summitTable.summitedAt,
          validated: summitTable.validated,
          createdAt: summitTable.createdAt,
          mountainId: mountainTable.id,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainHeight: mountainTable.height,
          userId: userTable.id,
          userUsername: userTable.username,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          userImageUrl: userTable.imageUrl,
        })
        .from(summitTable)
        .leftJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .leftJoin(userTable, eq(summitTable.userId, userTable.id))
        .where(eq(summitTable.id, params.id)),
      db
        .select({
          id: userTable.id,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(summitHasUsersTable)
        .innerJoin(userTable, eq(summitHasUsersTable.userId, userTable.id))
        .where(eq(summitHasUsersTable.summitId, params.id)),
    ]);

    const [row] = rows;
    if (!row) {
      set.status = 404;
      return { error: "Summit not found" };
    }

    const relatedUsers = relatedRows.map((u) => ({
      ...u,
      isMain: u.id === row.userId,
    }));

    return {
      success: true,
      message: { ...row, relatedUsers },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminSummitDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
