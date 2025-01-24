import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  summitHasUsersTable,
  mountainTable,
  summitTable,
  userTable,
} from "@/api/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";

export const summitRoute = new Elysia({ prefix: "/summit" }).use(JWT()).get(
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
    response: t.Object({
      success: t.Boolean(),
      message: t.Object({
        summitId: t.String(),
        summitedAt: t.String(),
        summitValidated: t.Boolean(),
        summitImageUrl: t.String(),
        mountainId: t.String(),
        mountainName: t.String(),
        mountainSlug: t.String(),
        mountainLocation: t.String(),
        mountainEssential: t.Boolean(),
        mountainHeight: t.String(),
        mountainLatitude: t.String(),
        mountainLongitude: t.String(),
        mountainImageUrl: t.Nullable(t.String()),
        users: t.Array(
          t.Object({
            userId: t.String(),
            firstName: t.Nullable(t.String()),
            lastName: t.Nullable(t.String()),
            imageUrl: t.Nullable(t.String()),
          }),
        ),
      }),
    }),

    query: t.Object({
      summitId: t.String(),
    }),
  },
);
