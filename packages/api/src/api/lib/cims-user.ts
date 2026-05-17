import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";

// Seeded by migration 0063_cims-official-user.sql — keep in sync.
export const CIMS_EMAIL = "hola@fescims.com";

export class CimsUserNotSeededError extends Error {
  constructor() {
    super("Official cims user not seeded");
  }
}

export const getCimsUserId = async (): Promise<string> => {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, CIMS_EMAIL));
  if (!row) throw new CimsUserNotSeededError();
  return row.id;
};
