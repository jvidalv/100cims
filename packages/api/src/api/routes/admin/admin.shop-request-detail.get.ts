import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { AdminShopRequestDetailSchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import { db } from "@/db";
import { shopRequestTable, userTable } from "@/db/schema";

export const adminShopRequestDetailGetRoute = new Elysia().get(
  "/shop-requests/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select()
      .from(shopRequestTable)
      .where(eq(shopRequestTable.id, params.id));
    if (!row) {
      set.status = 404;
      return { error: "Shop request not found" };
    }

    let user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null = null;
    if (row.userId) {
      const [u] = await db
        .select({
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(userTable)
        .where(eq(userTable.id, row.userId))
        .limit(1);
      user = u ?? null;
    }

    return { success: true, message: { ...row, user } };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminShopRequestDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
