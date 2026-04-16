import { and, asc, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { listPeopleIds } from "@/api/lib/people";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { BasicUsersArraySchema } from "@/api/schemas/user.schema";

export const userAllGetRoute = new Elysia().get(
  "/all",
  async ({ request, query }) => {
    const user = getUserFromRequest(request);
    const q = query.q;
    const mode = query.mode ?? "picker";

    // Search mode (used by /user/people/add): strict visibility gate +
    // email match + exclude self + exclude already-connected + cap at 10.
    if (mode === "search") {
      if (!q) return { success: true, message: [] };
      const alreadyConnected = await listPeopleIds(user.id);
      const connectedSet = new Set(alreadyConnected);

      // Normalize to NFC so decomposed accents from mobile keyboards
      // (e + combining acute) match postgres's `unaccent` dictionary.
      const term = `%${q.normalize("NFC")}%`;
      const rows = await db
        .select({
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(userTable)
        .where(
          and(
            // Discoverable publicly OR already-connected (so someone who
            // later toggled visibleOnPeopleSearch=false stays findable by
            // their existing connections).
            alreadyConnected.length > 0
              ? or(
                  eq(userTable.visibleOnPeopleSearch, true),
                  inArray(userTable.id, alreadyConnected),
                )
              : eq(userTable.visibleOnPeopleSearch, true),
            notInArray(userTable.id, [user.id]),
            or(
              sql`unaccent(${userTable.firstName}) ILIKE unaccent(${term})`,
              sql`unaccent(${userTable.lastName}) ILIKE unaccent(${term})`,
              sql`${userTable.email} ILIKE ${term}`,
            ),
          ),
        )
        .orderBy(asc(userTable.firstName))
        .limit(10);

      const users = rows.map((u) => ({
        ...u,
        isPerson: connectedSet.has(u.id),
      }));

      return { success: true, message: users };
    }

    // Picker mode (default, legacy) — keeps self-seeded fallback and
    // name-only match for backwards compatibility with plan / summit pickers.
    let users = [
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
    ];

    if (q) {
      const term = `%${q.normalize("NFC")}%`;
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
              sql`unaccent(${userTable.firstName}) ILIKE unaccent(${term})`,
              sql`unaccent(${userTable.lastName}) ILIKE unaccent(${term})`,
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
      mode: t.Optional(t.Union([t.Literal("picker"), t.Literal("search")])),
    }),
    response: SuccessResponse(BasicUsersArraySchema),
  },
);
