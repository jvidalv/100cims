import { asc, desc, eq, isNull, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
} from "@/db/schema";

const CSV_HEADERS = [
  "Date",
  "Mountain",
  "Height (m)",
  "Score",
  "Essential",
  "Official challenges",
];

// RFC 4180 escaping: wrap in quotes and double any embedded quote, when the
// field contains a comma, quote, or newline. Plain strings pass through.
const csvField = (value: string | number | null | undefined): string => {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const userSummitsExportGetRoute = new Elysia().get(
  "/summits/export",
  async ({ request }) => {
    const user = getUserFromRequest(request);

    // Aggregate the user's summits with the official-challenge names per
    // mountain in a single query. Official = challenge.creatorId IS NULL.
    const rows = await db
      .select({
        summitedAt: summitTable.summitedAt,
        mountainName: mountainTable.name,
        mountainHeight: mountainTable.height,
        mountainEssential: mountainTable.essential,
        officialChallenges: sql<string>`COALESCE(
          (
            SELECT STRING_AGG(${challengeTable.name}, ', ' ORDER BY ${challengeTable.name})
            FROM ${challengeHasMountainTable}
            INNER JOIN ${challengeTable}
              ON ${challengeTable.id} = ${challengeHasMountainTable.challengeId}
            WHERE ${challengeHasMountainTable.mountainId} = ${mountainTable.id}
              AND ${isNull(challengeTable.creatorId)}
          ),
          ''
        )`,
      })
      .from(summitHasUsersTable)
      .innerJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .where(eq(summitHasUsersTable.userId, user.id))
      .orderBy(desc(summitTable.summitedAt), asc(mountainTable.name));

    const lines = [CSV_HEADERS.join(",")];
    for (const row of rows) {
      const heightNum = parseInt(row.mountainHeight);
      const score = (heightNum / 10) * (row.mountainEssential ? 2 : 1);
      lines.push(
        [
          csvField(row.summitedAt),
          csvField(row.mountainName),
          csvField(heightNum),
          csvField(score),
          csvField(row.mountainEssential ? "yes" : "no"),
          csvField(row.officialChallenges),
        ].join(","),
      );
    }

    // BOM helps Excel detect UTF-8 — without it accents render as mojibake.
    const body = "﻿" + lines.join("\n") + "\n";

    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cims-summits.csv"',
      },
    });
  },
  {
    response: t.String({ description: "CSV body (text/csv; charset=utf-8)" }),
  },
);
