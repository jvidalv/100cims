import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/api/db/schema";

export const mountainsRoute = new Elysia({ prefix: "/mountains" })
  .get(
    "/all",
    async () => {
      const mountains = await db.select().from(mountainTable);

      return {
        success: true,
        message: mountains,
      };
    },
    {
      response: t.Object({
        success: t.Boolean(),
        message: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(),
            slug: t.String(),
            location: t.String(),
            essential: t.Boolean(),
            height: t.String(),
            latitude: t.String(),
            longitude: t.String(),
            url: t.String(),
            imageUrl: t.Nullable(t.String()),
          }),
        ),
      }),
    },
  )
  .get(
    "/summits",
    async ({ query }) => {
      const mountainId =
        query.mountainId === "undefined" ? undefined : query.mountainId;
      const limit = (query?.limit || 0) * 3 || 50;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          createdAt: summitTable.createdAt,
          mountainId: summitTable.mountainId,
          mountainName: mountainTable.name,
          userId: userTable.id,
          userFirstName: userTable.firstName,
          userLastName: userTable.lastName,
          userImageUrl: userTable.imageUrl,
        })
        .from(summitTable)
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          summitHasUsersTable,
          eq(summitTable.id, summitHasUsersTable.summitId),
        )
        .leftJoin(userTable, eq(summitHasUsersTable.userId, userTable.id))
        .where(
          and(
            eq(summitTable.validated, true),
            mountainId ? eq(summitTable.mountainId, mountainId) : undefined,
          ),
        )
        .orderBy(desc(summitTable.createdAt))
        .limit(limit)
        .execute();

      const groupedResults = results.reduce(
        (acc, row) => {
          const existingSummit = acc.find((s) => s.summitId === row.summitId);
          const user = {
            id: row.userId!,
            firstName: row.userFirstName,
            lastName: row.userLastName,
            imageUrl: row.userImageUrl,
          };

          if (existingSummit) {
            existingSummit.users.push(user);
          } else {
            acc.push({
              summitId: row.summitId,
              mountainId: row.mountainId!,
              summitedAt: row.summitedAt,
              createdAt: row.createdAt,
              mountainName: row.mountainName,
              users: [user],
            });
          }
          return acc;
        },
        [] as {
          summitId: string;
          mountainId: string;
          summitedAt: string;
          createdAt: Date;
          mountainName: string;
          users: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            imageUrl: string | null;
          }[];
        }[],
      );

      return {
        success: true,
        message: groupedResults.slice(0, query?.limit || 50),
      };
    },
    {
      response: t.Object({
        success: t.Boolean(),
        message: t.Array(
          t.Object({
            summitId: t.String(),
            summitedAt: t.String(),
            createdAt: t.Date(),
            mountainId: t.String(),
            mountainName: t.String(),
            users: t.Array(
              t.Object({
                id: t.String(),
                firstName: t.Nullable(t.String()), // Nullable if the user may not have a first name
                lastName: t.Nullable(t.String()), // Nullable if the user may not have a last name
                imageUrl: t.Nullable(t.String()), // Nullable if the user may not have an image
              }),
            ),
          }),
        ),
      }),
      query: t.Object({
        mountainId: t.Optional(t.String()),
        limit: t.Optional(t.Number()),
      }),
    },
  );
