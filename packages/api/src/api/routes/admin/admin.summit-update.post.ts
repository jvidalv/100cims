import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitTable } from "@/db/schema";
import { AdminSummitUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminSummitUpdatePostRoute = new Elysia().post(
  "/summits/:id",
  async ({ params, body, set }) => {
    try {
      const [row] = await db
        .update(summitTable)
        .set(body)
        .where(eq(summitTable.id, params.id))
        .returning({ id: summitTable.id });

      if (!row) {
        set.status = 404;
        return { error: "Summit not found" };
      }
      return { success: true };
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === "23503") {
        set.status = 400;
        return {
          error: `Invalid reference: ${err.constraint ?? "foreign key"}`,
        };
      }
      throw e;
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminSummitUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
