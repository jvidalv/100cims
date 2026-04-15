import { desc, eq, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userPeopleTable, userTable } from "@/db/schema";
import { AdminPersonSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminUserPeopleGetRoute = new Elysia().get(
  "/users/:id/people",
  async ({ params }) => {
    const otherUserId = sql<string>`CASE WHEN ${userPeopleTable.userAId} = ${params.id} THEN ${userPeopleTable.userBId} ELSE ${userPeopleTable.userAId} END`;

    const rows = await db
      .select({
        userId: otherUserId.as("user_id"),
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        email: userTable.email,
        imageUrl: userTable.imageUrl,
        connectedAt: userPeopleTable.createdAt,
      })
      .from(userPeopleTable)
      .innerJoin(userTable, eq(userTable.id, otherUserId))
      .where(
        or(
          eq(userPeopleTable.userAId, params.id),
          eq(userPeopleTable.userBId, params.id),
        ),
      )
      .orderBy(desc(userPeopleTable.createdAt));

    return { success: true, message: rows };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(t.Array(AdminPersonSchema)),
  },
);
