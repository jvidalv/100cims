import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTable } from "@/db/schema";

export type OptionalAuthUser = {
  id: string;
  activeChallengeId: string | null;
} | null;

/**
 * Extract bearer token from Authorization header.
 * Returns undefined if no valid Bearer token present.
 */
export function getBearerToken(
  headers: Record<string, string | undefined>,
): string | undefined {
  const authHeader = headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return undefined;
}

/**
 * Get user from JWT token if present.
 * Returns null if no token or invalid token (endpoint still works).
 */
export async function getOptionalUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt: { verify: (token?: string) => Promise<any> },
  token: string | undefined,
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
