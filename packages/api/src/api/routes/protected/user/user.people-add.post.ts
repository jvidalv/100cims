import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userPeopleTable, userTable } from "@/db/schema";
import { orderPeoplePair } from "@/api/lib/people";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const userPeopleAddPostRoute = new Elysia().post(
  "/people",
  async ({ request, body, set }) => {
    const user = getUserFromRequest(request);

    if (body.personUserId === user.id) {
      set.status = 400;
      return { error: "Cannot connect a user to themselves" };
    }

    const [target] = await db
      .select({
        id: userTable.id,
        visible: userTable.visibleOnPeopleSearch,
      })
      .from(userTable)
      .where(eq(userTable.id, body.personUserId))
      .limit(1);

    // Treat opted-out users as non-existent to avoid leaking account presence.
    if (!target || !target.visible) {
      set.status = 404;
      return { error: "User not found" };
    }

    // If we're already connected, no-op success.
    const [a, b] = orderPeoplePair(user.id, body.personUserId);
    const [existing] = await db
      .select({ id: userPeopleTable.id })
      .from(userPeopleTable)
      .where(
        and(eq(userPeopleTable.userAId, a), eq(userPeopleTable.userBId, b)),
      )
      .limit(1);
    if (existing) return { success: true };

    await db
      .insert(userPeopleTable)
      .values({ userAId: a, userBId: b })
      .onConflictDoNothing();

    return { success: true };
  },
  {
    body: t.Object({ personUserId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
