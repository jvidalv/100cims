import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";

export type OptionalAuthUser = {
  id: string;
  activeChallengeId: string | null;
} | null;

/**
 * Get user from JWT token if present.
 * Returns null if no token or invalid token (endpoint still works).
 */
export async function getOptionalUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt: { verify: (token?: string) => Promise<any> },
  token: string | undefined
): Promise<OptionalAuthUser> {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwt.verify(token);
    if (!verified || !verified.id) {
      return null;
    }

    const [user] = await db
      .select({
        id: userTable.id,
        activeChallengeId: userTable.activeChallengeId,
      })
      .from(userTable)
      .where(eq(userTable.id, verified.id as string));

    return user || null;
  } catch {
    return null;
  }
}
