import { and, eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  planTable,
  planHasUsersTable,
  planHasMountainsTable,
  planUserLogTable,
} from "@/api/db/schema";
import { formatDateForPostgresFromISOString } from "@/api/lib/dates";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";

export const planPrivateRoute = new Elysia({ prefix: "/plans" })
  .use(JWT())
  .post(
    "/create",
    async ({ body, store }) => {
      const user = getStoreUser(store);

      const [insertedPlan] = await db
        .insert(planTable)
        .values({
          creatorId: user.id,
          title: body.title,
          description: body.description,
          startDate: body.startDate
            ? formatDateForPostgresFromISOString(body.startDate)
            : null,
          speed: "normal",
          status: "open",
          challengeId: body.challengeId ?? null, // ✅ Add challengeId support
        })
        .returning();

      await db.insert(planHasUsersTable).values({
        userId: user.id,
        planId: insertedPlan.id,
        willBringDogs: false,
      });

      if (body.mountainIds?.length) {
        await db.insert(planHasMountainsTable).values(
          body.mountainIds.map((mountainId) => ({
            planId: insertedPlan.id,
            mountainId,
          })),
        );
      }

      return { success: true, message: insertedPlan };
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.String(),
        startDate: t.Optional(t.String()),
        mountainIds: t.Optional(t.Array(t.String())),
        challengeId: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/update",
    async ({ body, store, error }) => {
      const user = getStoreUser(store);

      const existing = await db
        .select({ creatorId: planTable.creatorId })
        .from(planTable)
        .where(eq(planTable.id, body.id))
        .limit(1);

      if (!existing.length || existing[0].creatorId !== user.id) {
        throw error(403, "Not authorized to update this plan");
      }

      const [updated] = await db
        .update(planTable)
        .set({
          title: body.title,
          description: body.description,
          status: body.status as unknown as typeof planTable.status,
          imageUrl: body.imageUrl ?? undefined,
          routeUrl: body.routeUrl ?? undefined,
          startDate: body.startDate
            ? formatDateForPostgresFromISOString(body.startDate)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(planTable.id, body.id))
        .returning();

      // Update mountains
      if (body.mountainIds) {
        await db
          .delete(planHasMountainsTable)
          .where(eq(planHasMountainsTable.planId, body.id));

        if (body.mountainIds.length) {
          await db.insert(planHasMountainsTable).values(
            body.mountainIds.map((mountainId) => ({
              planId: body.id,
              mountainId,
            })),
          );
        }
      }

      // Update users
      if (body.userIds) {
        const current = await db
          .select({ userId: planHasUsersTable.userId })
          .from(planHasUsersTable)
          .where(eq(planHasUsersTable.planId, body.id))
          .execute();

        const currentIds = current
          .map((u) => u.userId)
          .filter((id) => id !== user.id) as string[];
        const nextIds = body.userIds.filter((id) => id !== user.id);

        const toAdd = nextIds.filter((id) => !currentIds.includes(id));
        const toRemove = currentIds.filter((id) => !nextIds.includes(id));

        if (toRemove.length) {
          await db
            .delete(planHasUsersTable)
            .where(
              and(
                eq(planHasUsersTable.planId, body.id),
                inArray(planHasUsersTable.userId, toRemove),
              ),
            );

          await db.insert(planUserLogTable).values(
            toRemove.map((id) => ({
              planId: body.id,
              userId: id,
              action: "left",
            })),
          );
        }

        if (toAdd.length) {
          await db.insert(planHasUsersTable).values(
            toAdd.map((id) => ({
              planId: body.id,
              userId: id,
              willBringDogs: false,
            })),
          );

          await db.insert(planUserLogTable).values(
            toAdd.map((id) => ({
              planId: body.id,
              userId: id,
              action: "joined",
            })),
          );
        }
      }

      return { success: true, message: updated };
    },
    {
      body: t.Object({
        id: t.String(),
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        status: t.Optional(t.String()),
        routeUrl: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        mountainIds: t.Optional(t.Array(t.String())),
        userIds: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .post(
    "/delete",
    async ({ body, store }) => {
      const user = getStoreUser(store);

      const existing = await db
        .select({ creatorId: planTable.creatorId })
        .from(planTable)
        .where(eq(planTable.id, body.id))
        .limit(1);

      if (!existing.length || existing[0].creatorId !== user.id) {
        return {
          success: false,
          message: "Not authorized to delete this plan",
        };
      }

      await db.delete(planTable).where(eq(planTable.id, body.id));

      return { success: true, message: "Plan deleted successfully" };
    },
    {
      body: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/join",
    async ({ body, store, error }) => {
      const user = getStoreUser(store);

      const plan = await db
        .select({
          id: planTable.id,
          creatorId: planTable.creatorId,
          status: planTable.status,
        })
        .from(planTable)
        .where(eq(planTable.id, body.id))
        .limit(1);

      if (!plan.length) {
        throw error(404, "Plan not found");
      }

      const [targetPlan] = plan;

      if (targetPlan.status !== "open") {
        throw error(400, "Plan is not open for joining");
      }

      if (targetPlan.creatorId === user.id) {
        throw error(400, "You are the creator of this plan");
      }

      const alreadyJoined = await db
        .select({ id: planHasUsersTable.planId })
        .from(planHasUsersTable)
        .where(
          and(
            eq(planHasUsersTable.planId, body.id),
            eq(planHasUsersTable.userId, user.id),
          ),
        )
        .limit(1);

      if (alreadyJoined.length) {
        throw error(400, "You already joined this plan");
      }

      try {
        await db.insert(planUserLogTable).values({
          planId: body.id,
          userId: user.id,
          action: "joined",
        });
      } catch {
        // noop
      }

      await db.insert(planHasUsersTable).values({
        userId: user.id,
        planId: body.id,
        willBringDogs: false,
      });

      return { success: true };
    },
    {
      body: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/leave",
    async ({ body, store, error }) => {
      const user = getStoreUser(store);

      const plan = await db
        .select({
          id: planTable.id,
          creatorId: planTable.creatorId,
          status: planTable.status,
        })
        .from(planTable)
        .where(eq(planTable.id, body.id))
        .limit(1);

      if (!plan.length) {
        throw error(404, "Plan not found");
      }

      const [targetPlan] = plan;

      if (targetPlan.creatorId === user.id) {
        throw error(400, "Creators cannot leave their own plan");
      }

      await db
        .delete(planHasUsersTable)
        .where(
          and(
            eq(planHasUsersTable.planId, body.id),
            eq(planHasUsersTable.userId, user.id),
          ),
        );

      try {
        await db.insert(planUserLogTable).values({
          planId: body.id,
          userId: user.id,
          action: "left",
        });
      } catch {
        // noop
      }

      return { success: true };
    },
    {
      body: t.Object({
        id: t.String(),
      }),
    },
  );
