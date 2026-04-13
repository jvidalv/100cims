import { sql, type SQL } from "drizzle-orm";

import { userTable } from "@/db/schema";

export const creatorNameConcat = (): SQL<string | null> =>
  sql<
    string | null
  >`NULLIF(TRIM(COALESCE(${userTable.firstName}, '') || CASE WHEN ${userTable.lastName} IS NOT NULL THEN ' ' || ${userTable.lastName} ELSE '' END), '')`;
