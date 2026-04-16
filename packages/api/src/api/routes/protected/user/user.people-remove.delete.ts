import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userPeopleTable } from "@/db/schema";
import { orderPeoplePair } from "@/api/lib/people";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const userPeopleRemoveDeleteRoute = new Elysia().delete(
  "/people/:personUserId",
  async ({ request, params }) => {
    const user = getUserFromRequest(request);
    const [a, b] = orderPeoplePair(user.id, params.personUserId);
    await db
      .delete(userPeopleTable)
      .where(
        and(eq(userPeopleTable.userAId, a), eq(userPeopleTable.userBId, b)),
      );
    return { success: true };
  },
  {
    params: t.Object({ personUserId: t.String() }),
    response: SimpleSuccessResponse,
  },
);
