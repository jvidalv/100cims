import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";

export const getAdminStatusByEmail = async (email: string) => {
  const [row] = await db
    .select({ id: userTable.id, admin: userTable.admin })
    .from(userTable)
    .where(eq(userTable.email, email));
  return row ?? null;
};
