import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { mountainTable, summitTable, userTable } from "@/db/schema";

export const getPublicStats = async () => {
  const [users, summits, mountains, essentials] = await Promise.all([
    db.select({ c: count() }).from(userTable),
    db.select({ c: count() }).from(summitTable),
    db.select({ c: count() }).from(mountainTable),
    db
      .select({ c: count() })
      .from(mountainTable)
      .where(eq(mountainTable.essential, true)),
  ]);
  return {
    totalUsers: users[0]?.c ?? 0,
    totalSummits: summits[0]?.c ?? 0,
    totalMountains: mountains[0]?.c ?? 0,
    essentialMountainCount: essentials[0]?.c ?? 0,
  };
};
