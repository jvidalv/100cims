import { asc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  organizationMemberTable,
  organizationTable,
  userTable,
} from "@/db/schema";
import { AdminOrganizationDetailSchema } from "@/api/schemas/admin-organization.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminOrganizationDetailGetRoute = new Elysia().get(
  "/organizations/:id",
  async ({ params, set }) => {
    // Org + members fan out in parallel — members is wasted work on the
    // 404 path, but on the happy path (the common case for admin nav)
    // this saves a round trip vs serial select-then-select.
    const [[org], members] = await Promise.all([
      db
        .select({
          id: organizationTable.id,
          name: organizationTable.name,
          description: organizationTable.description,
          websiteUrl: organizationTable.websiteUrl,
          imageUrl: organizationTable.imageUrl,
          createdAt: organizationTable.createdAt,
          updatedAt: organizationTable.updatedAt,
        })
        .from(organizationTable)
        .where(eq(organizationTable.id, params.id)),
      db
        .select({
          userId: organizationMemberTable.userId,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          joinedAt: organizationMemberTable.joinedAt,
        })
        .from(organizationMemberTable)
        .innerJoin(userTable, eq(organizationMemberTable.userId, userTable.id))
        .where(eq(organizationMemberTable.organizationId, params.id))
        .orderBy(asc(organizationMemberTable.joinedAt)),
    ]);

    if (!org) {
      set.status = 404;
      return { error: "Organization not found" };
    }

    return {
      success: true,
      message: {
        ...org,
        members,
      },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminOrganizationDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
