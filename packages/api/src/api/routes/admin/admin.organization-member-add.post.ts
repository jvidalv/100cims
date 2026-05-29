import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  organizationMemberTable,
  organizationTable,
  userTable,
} from "@/db/schema";
import { AdminOrganizationMemberAddBodySchema } from "@/api/schemas/admin-organization.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminOrganizationMemberAddPostRoute = new Elysia().post(
  "/organizations/:id/members",
  async ({ params, body, set }) => {
    // Fan out the existence checks in parallel — they're independent and
    // we still need both 404 verdicts before deciding which error to
    // return on the failure path.
    const [[org], [user]] = await Promise.all([
      db
        .select({ id: organizationTable.id })
        .from(organizationTable)
        .where(eq(organizationTable.id, params.id)),
      db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.id, body.userId)),
    ]);
    if (!org) {
      set.status = 404;
      return { error: "Organization not found" };
    }
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    // Atomic check-then-insert via `onConflictDoNothing` on the
    // (org, user) unique index. Returning the inserted row distinguishes
    // "added" (rows non-empty) from "already a member" (rows empty) —
    // closes the race window a separate SELECT + INSERT would leave open
    // for two concurrent admin requests.
    const inserted = await db
      .insert(organizationMemberTable)
      .values({
        organizationId: params.id,
        userId: body.userId,
      })
      .onConflictDoNothing({
        target: [
          organizationMemberTable.organizationId,
          organizationMemberTable.userId,
        ],
      })
      .returning({ id: organizationMemberTable.id });

    if (inserted.length === 0) {
      set.status = 409;
      return { error: "User already a member" };
    }

    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminOrganizationMemberAddBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
    },
  },
);
