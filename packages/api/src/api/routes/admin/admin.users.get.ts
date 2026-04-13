import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable, userTable } from "@/db/schema";
import { AdminUsersResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

export const adminUsersGetRoute = new Elysia().get(
  "/users",
  async ({ query }) => {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    const search = query.q?.trim();
    if (search) {
      const pattern = `%${search}%`;
      const searchCondition = or(
        ilike(userTable.email, pattern),
        ilike(userTable.firstName, pattern),
        ilike(userTable.lastName, pattern),
        ilike(userTable.username, pattern),
        sql`${userTable.firstName} || ' ' || ${userTable.lastName} ILIKE ${pattern}`,
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (query.country) conditions.push(eq(userTable.country, query.country));
    if (query.platform) conditions.push(eq(userTable.platform, query.platform));
    if (query.version) conditions.push(eq(userTable.appVersion, query.version));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countResult, items, countryRows, platformRows, versionRows] =
      await Promise.all([
        db.select({ total: count() }).from(userTable).where(where),
        db
          .select({
            id: userTable.id,
            firstName: userTable.firstName,
            lastName: userTable.lastName,
            username: userTable.username,
            email: userTable.email,
            imageUrl: userTable.imageUrl,
            country: userTable.country,
            platform: userTable.platform,
            appVersion: userTable.appVersion,
            createdAt: userTable.createdAt,
            admin: userTable.admin,
            activeChallengeId: userTable.activeChallengeId,
            activeChallengeName: challengeTable.name,
            hasPushToken: sql<boolean>`${userTable.expoPushToken} IS NOT NULL`,
          })
          .from(userTable)
          .leftJoin(
            challengeTable,
            eq(userTable.activeChallengeId, challengeTable.id),
          )
          .where(where)
          .orderBy(desc(userTable.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .selectDistinct({ value: userTable.country })
          .from(userTable)
          .where(isNotNull(userTable.country))
          .orderBy(userTable.country),
        db
          .selectDistinct({ value: userTable.platform })
          .from(userTable)
          .where(isNotNull(userTable.platform))
          .orderBy(userTable.platform),
        db
          .selectDistinct({ value: userTable.appVersion })
          .from(userTable)
          .where(isNotNull(userTable.appVersion))
          .orderBy(desc(userTable.appVersion)),
      ]);

    const total = countResult[0].total;

    return {
      success: true,
      message: {
        items,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        facets: {
          countries: countryRows
            .map((r) => r.value)
            .filter((v): v is string => v !== null),
          platforms: platformRows
            .map((r) => r.value)
            .filter((v): v is string => v !== null),
          versions: versionRows
            .map((r) => r.value)
            .filter((v): v is string => v !== null),
        },
      },
    };
  },
  {
    query: t.Object({
      page: t.Optional(t.Number()),
      pageSize: t.Optional(t.Number()),
      q: t.Optional(t.String()),
      country: t.Optional(t.String()),
      platform: t.Optional(t.String()),
      version: t.Optional(t.String()),
    }),
    response: SuccessResponse(AdminUsersResponseSchema),
  },
);
