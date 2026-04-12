import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSchema } from "@/api/schemas/user.schema";

export const userOneGetRoute = new Elysia().get(
  "/one",
  async ({ query }) => {
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, query.userId));
    const user = users?.[0];

    return {
      success: true,
      message: user,
    };
  },
  {
    query: t.Object({
      userId: t.String(),
    }),
    response: SuccessResponse(UserSchema),
  },
);
