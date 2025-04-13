import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/api/db/schema";

export const mountainsRoute = new Elysia({ prefix: "/mountains" })
  .get(
    "/one",
    async ({ query }) => {
      const mountain = await db
        .select({
          id: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          location: mountainTable.location,
          essential: mountainTable.essential,
          height: mountainTable.height,
          latitude: mountainTable.latitude,
          longitude: mountainTable.longitude,
          imageUrl: mountainTable.imageUrl,
        })
        .from(mountainTable)
        .where(eq(mountainTable.slug, query.mountainSlug));

      return {
        success: true,
        message: mountain[0],
      };
    },
    {
      query: t.Object({
        mountainSlug: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.Object({
          id: t.String(),
          name: t.String(),
          slug: t.String(),
          location: t.String(),
          essential: t.Boolean(),
          height: t.String(),
          latitude: t.String(),
          longitude: t.String(),
          imageUrl: t.Nullable(t.String()),
        }),
      }),
    },
  )
  .get(
    "/all",
    async ({ query }) => {
      const mountains = await db
        .select({
          id: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          location: mountainTable.location,
          essential: mountainTable.essential,
          height: mountainTable.height,
          latitude: mountainTable.latitude,
          longitude: mountainTable.longitude,
          imageUrl: mountainTable.imageUrl,
        })
        .from(mountainTable)
        .innerJoin(
          challengeHasMountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id),
        )
        .where(eq(challengeHasMountainTable.challengeId, query.challengeId));

      return {
        success: true,
        message: mountains,
      };
    },
    {
      query: t.Object({
        challengeId: t.String(),
      }),
    },
  )
  .get(
    "/summits",
    async ({ query }) => {
      const mountainId =
        !query.mountainId || query.mountainId === "undefined"
          ? undefined
          : query.mountainId;
      const limit = (query?.limit || 0) * 3 || 500;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          summitImageUrl: summitTable.imageUrl,
          createdAt: summitTable.createdAt,
          mountainId: summitTable.mountainId,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
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
        .leftJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(
          and(
            eq(summitTable.validated, true),
            mountainId ? eq(summitTable.mountainId, mountainId) : undefined,
            query.challengeId
              ? eq(challengeHasMountainTable.challengeId, query.challengeId)
              : undefined,
          ),
        )
        .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt))
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
              mountainSlug: row.mountainSlug,
              summitImageUrl: row.summitImageUrl,
              users: [user],
            });
          }
          return acc;
        },
        [] as {
          summitId: string;
          mountainId: string;
          mountainSlug: string;
          summitImageUrl: string;
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
      query: t.Object({
        challengeId: t.String(),
        mountainId: t.Optional(t.Nullable(t.String())),
        limit: t.Optional(t.Nullable(t.Number())),
      }),
    },
  );
