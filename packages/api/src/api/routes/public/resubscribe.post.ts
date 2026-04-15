import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { verifyEmailToken } from "@/api/lib/email-tokens";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const resubscribePostRoute = new Elysia().post(
  "/resubscribe",
  async ({ body, set }) => {
    const claims = await verifyEmailToken(body.token);
    if (!claims || claims.purpose !== "resubscribe") {
      set.status = 400;
      return { error: "Invalid or expired link" };
    }
    await db
      .update(userTable)
      .set({ emailNotificationsEnabled: true, updatedAt: new Date() })
      .where(eq(userTable.id, claims.userId));
    return { success: true };
  },
  {
    body: t.Object({ token: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
    },
  },
);
