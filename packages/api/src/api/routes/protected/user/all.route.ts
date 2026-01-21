import { and, asc, eq, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { BasicUsersArraySchema } from "@/api/schemas/user.schema";

export const allRoute = new Elysia().use(JWT()).get(
  "/all",
  async ({ store, query }) => {
    const user = getStoreUser(store);
    const q = query.q;

    let users = [
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
    ];

    if (q) {
      users = await db
        .select({
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(userTable)
        .where(
          and(
            or(
              eq(userTable.visibleOnPeopleSearch, true),
              eq(userTable.id, user.id),
            ),
            or(
              sql`unaccent(${userTable.firstName}) ILIKE unaccent(${`%${q}%`})`,
              sql`unaccent(${userTable.lastName}) ILIKE unaccent(${`%${q}%`})`,
            ),
          ),
        )
        .orderBy(asc(userTable.firstName));
    }

    return {
      success: true,
      message: users,
    };
  },
  {
    query: t.Object({
      q: t.String(),
    }),
    response: SuccessResponse(BasicUsersArraySchema),
  },
);
