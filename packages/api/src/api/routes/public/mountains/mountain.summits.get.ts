import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUser,
} from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { SummitsArraySchema } from "@/api/schemas/mountain.schema";

export const mountainSummitsGetRoute = new Elysia().use(JWT()).get(
  "/summits",
  async ({ query, jwt, headers }) => {
    const mountainId =
      !query.mountainId || query.mountainId === "undefined"
        ? undefined
        : query.mountainId;
    const limit = (query?.limit || 0) * 3 || 500;
    const optionalUser = await getOptionalUser(jwt, getBearerToken(headers));
    // Priority: query.challengeId > user.activeChallengeId > DEFAULT_CHALLENGE_ID
    const challengeId = resolveChallengeId(query.challengeId, optionalUser);

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
          eq(challengeHasMountainTable.challengeId, challengeId),
        ),
      )
      .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt))
      .limit(limit)
      .execute();

    const groupedResults = results.reduce(
      (acc, row) => {
        // Both `userId` (left-joined userTable) and `mountainId` (widened by
        // the presence of left joins) come through nullable in drizzle's
        // types — skip the row if either is missing rather than asserting.
        if (!row.userId || !row.mountainId) return acc;
        const existingSummit = acc.find((s) => s.summitId === row.summitId);
        const user = {
          id: row.userId,
          firstName: row.userFirstName,
          lastName: row.userLastName,
          imageUrl: row.userImageUrl,
        };

        if (existingSummit) {
          existingSummit.users.push(user);
        } else {
          acc.push({
            summitId: row.summitId,
            mountainId: row.mountainId,
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
      challengeId: t.Optional(t.String()),
      mountainId: t.Optional(t.Nullable(t.String())),
      limit: t.Optional(t.Nullable(t.Number())),
    }),
    response: SuccessResponse(SummitsArraySchema),
  },
);
