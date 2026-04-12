import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  summitHasUsersTable,
  mountainTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { SummitDetailSchema } from "@/api/schemas/summit.schema";

export const summitOneGetRoute = new Elysia().get(
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
    response: SuccessResponse(SummitDetailSchema),
  },
);
