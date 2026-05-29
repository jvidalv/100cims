import { desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeTable,
  mountainTable,
  organizationTable,
  planHasMountainsTable,
  planHasUsersTable,
  planMessageTable,
  planTable,
  userTable,
} from "@/db/schema";
import { AdminPlanDetailSchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

const RECENT_MESSAGES_LIMIT = 50;

export const adminPlanDetailGetRoute = new Elysia().get(
  "/plans/:id",
  async ({ params, set }) => {
    const [plan] = await db
      .select({
        id: planTable.id,
        title: planTable.title,
        description: planTable.description,
        imageUrl: planTable.imageUrl,
        routeUrl: planTable.routeUrl,
        whatsappGroupUrl: planTable.whatsappGroupUrl,
        wikilocUrl: planTable.wikilocUrl,
        stravaUrl: planTable.stravaUrl,
        startDate: planTable.startDate,
        startTime: planTable.startTime,
        type: planTable.type,
        speed: planTable.speed,
        status: planTable.status,
        isPrivate: planTable.isPrivate,
        featured: planTable.featured,
        paid: planTable.paid,
        organizationId: organizationTable.id,
        organizationName: organizationTable.name,
        creatorId: planTable.creatorId,
        challengeId: challengeTable.id,
        challengeName: challengeTable.name,
        createdAt: planTable.createdAt,
        updatedAt: planTable.updatedAt,
        creatorUsername: userTable.username,
        creatorFirstName: userTable.firstName,
        creatorLastName: userTable.lastName,
        creatorImageUrl: userTable.imageUrl,
      })
      .from(planTable)
      .leftJoin(userTable, eq(planTable.creatorId, userTable.id))
      .leftJoin(challengeTable, eq(planTable.challengeId, challengeTable.id))
      .leftJoin(
        organizationTable,
        eq(planTable.organizationId, organizationTable.id),
      )
      .where(eq(planTable.id, params.id));

    if (!plan) {
      set.status = 404;
      return { error: "Plan not found" };
    }

    const [participantRows, mountainRows, messageRows] = await Promise.all([
      db
        .select({
          userId: userTable.id,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          joinedAt: planHasUsersTable.joinedAt,
          willBringDogs: planHasUsersTable.willBringDogs,
          role: planHasUsersTable.role,
        })
        .from(planHasUsersTable)
        .innerJoin(userTable, eq(planHasUsersTable.userId, userTable.id))
        .where(eq(planHasUsersTable.planId, params.id))
        // Organizers first (postgres treats true > false on the boolean
        // expression), then most-recently-joined within each role.
        .orderBy(
          sql`${planHasUsersTable.role} = 'organizer' DESC`,
          desc(planHasUsersTable.joinedAt),
        ),
      db
        .select({
          mountainId: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          height: mountainTable.height,
          essential: mountainTable.essential,
          imageUrl: mountainTable.imageUrl,
        })
        .from(planHasMountainsTable)
        .innerJoin(
          mountainTable,
          eq(planHasMountainsTable.mountainId, mountainTable.id),
        )
        .where(eq(planHasMountainsTable.planId, params.id))
        .orderBy(desc(mountainTable.height)),
      db
        .select({
          id: planMessageTable.id,
          message: planMessageTable.message,
          createdAt: planMessageTable.createdAt,
          userId: planMessageTable.userId,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(planMessageTable)
        .leftJoin(userTable, eq(planMessageTable.userId, userTable.id))
        .where(eq(planMessageTable.planId, params.id))
        .orderBy(desc(planMessageTable.createdAt))
        .limit(RECENT_MESSAGES_LIMIT),
    ]);

    const {
      creatorUsername,
      creatorFirstName,
      creatorLastName,
      creatorImageUrl,
      ...rest
    } = plan;

    return {
      success: true,
      message: {
        ...rest,
        creator: {
          id: plan.creatorId,
          username: creatorUsername,
          firstName: creatorFirstName,
          lastName: creatorLastName,
          imageUrl: creatorImageUrl,
        },
        participants: participantRows.map((p) => ({
          ...p,
          isCreator: p.userId === plan.creatorId,
        })),
        mountains: mountainRows,
        recentMessages: messageRows,
      },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminPlanDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
