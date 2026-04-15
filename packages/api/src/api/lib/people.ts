import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { userPeopleTable } from "@/db/schema";

export const orderPeoplePair = (x: string, y: string): [string, string] =>
  x < y ? [x, y] : [y, x];

export const arePeople = async (x: string, y: string): Promise<boolean> => {
  const [a, b] = orderPeoplePair(x, y);
  const [row] = await db
    .select({ id: userPeopleTable.id })
    .from(userPeopleTable)
    .where(and(eq(userPeopleTable.userAId, a), eq(userPeopleTable.userBId, b)))
    .limit(1);
  return !!row;
};

export const listPeopleIds = async (userId: string): Promise<string[]> => {
  const rows = await db
    .select({
      userAId: userPeopleTable.userAId,
      userBId: userPeopleTable.userBId,
    })
    .from(userPeopleTable)
    .where(
      or(
        eq(userPeopleTable.userAId, userId),
        eq(userPeopleTable.userBId, userId),
      ),
    );
  return rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId));
};
