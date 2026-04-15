import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userPeopleTable } from "@/db/schema";
import { orderPeoplePair } from "@/api/lib/people";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const adminUserPersonRemoveDeleteRoute = new Elysia().delete(
  "/users/:id/people/:personUserId",
  async ({ params }) => {
    const [userAId, userBId] = orderPeoplePair(params.id, params.personUserId);
    await db
      .delete(userPeopleTable)
      .where(
        and(
          eq(userPeopleTable.userAId, userAId),
          eq(userPeopleTable.userBId, userBId),
        ),
      );
    return { success: true };
  },
  {
    params: t.Object({ id: t.String(), personUserId: t.String() }),
    response: SimpleSuccessResponse,
  },
);
