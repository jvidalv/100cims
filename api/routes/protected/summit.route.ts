import { and, count, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  summitHasUsersTable,
  mountainTable,
  summitTable,
  userTable,
} from "@/api/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";

export const summitRoute = new Elysia({ prefix: "/summit" })
  .use(JWT())
  .get(
    "/one",
    async ({ query }) => {
      const { summitId } = query;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          summitValidated: summitTable.validated,
          summitImageUrl: summitTable.imageUrl,
          mountainId: mountainTable.id,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainLocation: mountainTable.location,
          mountainEssential: mountainTable.essential,
          mountainHeight: mountainTable.height,
          mountainLatitude: mountainTable.latitude,
          mountainLongitude: mountainTable.longitude,
          mountainImageUrl: mountainTable.imageUrl,
          users: sql<
            {
              userId: string;
              firstName: string | null;
              lastName: string | null;
              imageUrl: string | null;
            }[]
          >`ARRAY(
          SELECT jsonb_build_object(
            'userId', ${userTable.id},
            'firstName', ${userTable.firstName},
            'lastName', ${userTable.lastName},
            'imageUrl', ${userTable.imageUrl}
          )
          FROM ${summitHasUsersTable}
          INNER JOIN ${userTable}
          ON ${summitHasUsersTable.userId} = ${userTable.id}
          WHERE ${summitHasUsersTable.summitId} = ${summitTable.id}
        )`.as("users"),
        })
        .from(summitTable)
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .where(eq(summitTable.id, summitId));

      return {
        success: true,
        message: results[0],
      };
    },
    {
      query: t.Object({
        summitId: t.String(),
      }),
    },
  )
  .post(
    "/delete",
    async ({ body, store }) => {
      const { summitId } = body;

      const userId = getStoreUser(store).id;
      if (!userId) {
        return { success: false, message: "Unauthorized" };
      }

      // Check if the user is associated with the summit
      const summitUserRecord = await db
        .select()
        .from(summitHasUsersTable)
        .where(
          and(
            eq(summitHasUsersTable.summitId, summitId),
            eq(summitHasUsersTable.userId, userId),
          ),
        );

      if (!summitUserRecord.length) {
        return {
          success: false,
          message: "Summit record not found or unauthorized",
        };
      }

      // Count how many users are associated with this summit
      const userCount = await db
        .select({ count: count() })
        .from(summitHasUsersTable)
        .where(eq(summitHasUsersTable.summitId, summitId));

      // Delete the summitHasUsers record
      await db
        .delete(summitHasUsersTable)
        .where(
          and(
            eq(summitHasUsersTable.summitId, summitId),
            eq(summitHasUsersTable.userId, userId),
          ),
        );

      // If it's the last user associated with the summit, delete the summit itself
      if (userCount[0].count === 1) {
        await db.delete(summitTable).where(eq(summitTable.id, summitId));
      }

      return { success: true, message: "Summit record deleted successfully" };
    },
    {
      body: t.Object({
        summitId: t.String(),
      }),
    },
  );
