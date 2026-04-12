import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable } from "@/db/schema";
import { AdminMountainUpdateBodySchema } from "@/api/schemas/admin-mountain.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMountainUpdatePostRoute = new Elysia().post(
  "/mountains/:id",
  async ({ params, body, set }) => {
    try {
      const [row] = await db
        .update(mountainTable)
        .set(body)
        .where(eq(mountainTable.id, params.id))
        .returning({ id: mountainTable.id });

      if (!row) {
        set.status = 404;
        return { error: "Mountain not found" };
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
    body: AdminMountainUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
    },
  },
);
