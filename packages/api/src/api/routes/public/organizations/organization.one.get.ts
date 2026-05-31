import { and, asc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  organizationMemberTable,
  organizationTable,
  userTable,
} from "@/db/schema";
import { ErrorResponse, SuccessResponse } from "@/api/schemas/common.schema";
import { OrganizationDetailSchema } from "@/api/schemas/organization.schema";

/**
 * Public read of an organization + its members. Drives the
 * `/organization/[id]` mobile screen the user lands on after tapping the
 * "Hosted by" row on a plan. No auth required — orgs are public listings.
 */
export const organizationOneGetRoute = new Elysia().get(
  "/one",
  async ({ query, set }) => {
    const [org, members] = await Promise.all([
      db
        .select({
          id: organizationTable.id,
          name: organizationTable.name,
          description: organizationTable.description,
          websiteUrl: organizationTable.websiteUrl,
          imageUrl: organizationTable.imageUrl,
          instagramUrl: organizationTable.instagramUrl,
          tiktokUrl: organizationTable.tiktokUrl,
          whatsappUrl: organizationTable.whatsappUrl,
          youtubeUrl: organizationTable.youtubeUrl,
          stravaUrl: organizationTable.stravaUrl,
          createdAt: organizationTable.createdAt,
        })
        .from(organizationTable)
        .where(eq(organizationTable.id, query.id))
        .limit(1),
      db
        .select({
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(organizationMemberTable)
        .innerJoin(userTable, eq(organizationMemberTable.userId, userTable.id))
        // Privacy: exclude members who opted out of public discovery. Same
        // convention as /protected/user/all — `visibleOnPeopleSearch=false`
        // means "don't surface me to anonymous callers". The total-members
        // count below reflects the visible-only list, not the raw row
        // count from organization_member.
        .where(
          and(
            eq(organizationMemberTable.organizationId, query.id),
            eq(userTable.visibleOnPeopleSearch, true),
          ),
        )
        .orderBy(asc(organizationMemberTable.joinedAt)),
    ]);

    if (!org.length) {
      set.status = 404;
      return { success: false, message: "NOT_FOUND" };
    }

    return {
      success: true,
      message: {
        ...org[0],
        members,
      },
    };
  },
  {
    query: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(OrganizationDetailSchema),
      404: ErrorResponse,
    },
  },
);
