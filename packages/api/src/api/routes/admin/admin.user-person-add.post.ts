import { inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userPeopleTable, userTable } from "@/db/schema";
import { orderPeoplePair } from "@/api/lib/people";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminUserPersonAddPostRoute = new Elysia().post(
  "/users/:id/people",
  async ({ params, body, set }) => {
    if (params.id === body.personUserId) {
      set.status = 400;
      return { error: "Cannot connect a user to themselves" };
    }

    const existing = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(inArray(userTable.id, [params.id, body.personUserId]));
    if (existing.length !== 2) {
      set.status = 404;
      return { error: "User not found" };
    }

    const [userAId, userBId] = orderPeoplePair(params.id, body.personUserId);
    await db
      .insert(userPeopleTable)
      .values({ userAId, userBId })
      .onConflictDoNothing();

    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Object({ personUserId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
