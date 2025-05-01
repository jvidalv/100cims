import { and, eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  planHasUsersTable,
  planMessageTable,
  planTable,
  planUserMessageReadTable,
  userTable
} from "@/api/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";

export const planChatRoute = new Elysia({ prefix: "/plans/chat" })
  .use(JWT())
  .post(
    "/read",
    async ({ body, store }) => {
      const user = getStoreUser(store);

      const exists = await db
        .select({ id: planUserMessageReadTable.id })
        .from(planUserMessageReadTable)
        .where(
          and(
            eq(planUserMessageReadTable.planId, body.planId),
            eq(planUserMessageReadTable.userId, user.id),
          ),
        )
        .limit(1);

      if (exists.length) {
        await db
          .update(planUserMessageReadTable)
          .set({ lastReadAt: new Date() })
          .where(eq(planUserMessageReadTable.id, exists[0].id));
      } else {
        await db.insert(planUserMessageReadTable).values({
          userId: user.id,
          planId: body.planId,
          lastReadAt: new Date(),
        });
      }

      return { success: true };
    },
    {
      body: t.Object({
        planId: t.String(),
      }),
    },
  )
  .get("/unread", async ({ store }) => {
    const user = getStoreUser(store);

    // Get all plan memberships and last read timestamps for this user
    const lastReads = await db
      .select({
        planId: planUserMessageReadTable.planId,
        lastReadAt: planUserMessageReadTable.lastReadAt,
      })
      .from(planUserMessageReadTable)
      .where(eq(planUserMessageReadTable.userId, user.id));

    const lastReadMap = new Map(
      lastReads.map(({ planId, lastReadAt }) => [planId, lastReadAt]),
    );

    // Get all plans the user is part of
    const userPlans = await db
      .select({ planId: planHasUsersTable.planId })
      .from(planHasUsersTable)
      .where(eq(planHasUsersTable.userId, user.id));

    const planIds = userPlans.map((p) => p.planId);

    if (planIds.length === 0) {
      return { success: true, message: [] };
    }

    // Get messages from those plans
    const messages = await db
      .select({
        planId: planMessageTable.planId,
        createdAt: planMessageTable.createdAt,
      })
      .from(planMessageTable)
      .where(inArray(planMessageTable.planId, planIds));

    const unread = messages.reduce((acc, message) => {
      const lastSeen = lastReadMap.get(message.planId);
      if (!lastSeen || message.createdAt > lastSeen) {
        acc.add(message.planId);
      }
      return acc;
    }, new Set<string>());

    return { success: true, message: Array.from(unread) };
  })
  .post(
    "/send",
    async ({ body, store }) => {
      const user = getStoreUser(store);

      const [message] = await db
        .insert(planMessageTable)
        .values({
          userId: user.id,
          planId: body.planId,
          message: body.message,
        })
        .returning();

      return { success: true, message };
    },
    {
      body: t.Object({
        planId: t.String(),
        message: t.String(),
      }),
    },
  )
  .get(
    "/all",
    async ({ query }) => {
      const messages = await db
        .select({
          id: planMessageTable.id,
          message: planMessageTable.message,
          createdAt: planMessageTable.createdAt,
          user: {
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            imageUrl: userTable.imageUrl,
          },
        })
        .from(planMessageTable)
        .innerJoin(userTable, eq(planMessageTable.userId, userTable.id))
        .where(eq(planMessageTable.planId, query.planId))
        .orderBy(planMessageTable.createdAt);

      return { success: true, message: messages };
    },
    {
      query: t.Object({
        planId: t.String(),
      }),
    },
  )
  .delete(
    "/delete",
    async ({ body, store, error }) => {
      const user = getStoreUser(store);

      const message = await db
        .select({
          id: planMessageTable.id,
          userId: planMessageTable.userId,
          planId: planMessageTable.planId,
        })
        .from(planMessageTable)
        .where(eq(planMessageTable.id, body.messageId))
        .limit(1);

      if (!message.length) {
        throw error(404, "Message not found");
      }

      const [msg] = message;

      if (msg.userId !== user.id) {
        const plan = await db
          .select({ creatorId: planTable.creatorId })
          .from(planTable)
          .where(eq(planTable.id, msg.planId))
          .limit(1);

        if (!plan.length || plan[0].creatorId !== user.id) {
          throw error(403, "Not authorized to delete this message");
        }
      }

      await db
        .delete(planMessageTable)
        .where(eq(planMessageTable.id, body.messageId));

      return { success: true };
    },
    {
      body: t.Object({
        messageId: t.String(),
      }),
    },
  );
