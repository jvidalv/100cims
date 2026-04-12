import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { AdminUserUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminUserUpdatePostRoute = new Elysia().post(
  "/users/:id",
  async ({ params, body, set }) => {
    try {
      const [row] = await db
        .update(userTable)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(userTable.id, params.id))
        .returning({ id: userTable.id });

      if (!row) {
        set.status = 404;
        return { error: "User not found" };
      }
      return { success: true };
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === "23505") {
        set.status = 409;
        return { error: `Conflict: ${err.constraint ?? "unique constraint"}` };
      }
      throw e;
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminUserUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
    },
  },
);
