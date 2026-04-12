import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserSchema } from "@/api/schemas/user.schema";

export const adminMeGetRoute = new Elysia().get(
  "/me",
  async ({ request }) => {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, getAdminUserId(request)));
    return { success: true, message: user };
  },
  { response: SuccessResponse(UserSchema) },
);
