import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeHasMountainTable, mountainTable } from "@/db/schema";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUser,
} from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MountainsArraySchema } from "@/api/schemas/mountain.schema";

export const allRoute = new Elysia()
  .use(JWT())
  .get(
    "/all",
    async ({ query, jwt, headers }) => {
      const optionalUser = await getOptionalUser(jwt, getBearerToken(headers));
      // Priority: query.challengeId > user.activeChallengeId > DEFAULT_CHALLENGE_ID
      const challengeId = resolveChallengeId(query.challengeId, optionalUser);

      const mountains = await db
        .select({
          id: mountainTable.id,
          name: mountainTable.name,
          slug: mountainTable.slug,
          location: mountainTable.location,
          essential: mountainTable.essential,
          height: mountainTable.height,
          latitude: mountainTable.latitude,
          longitude: mountainTable.longitude,
          imageUrl: mountainTable.imageUrl,
        })
        .from(mountainTable)
        .innerJoin(
          challengeHasMountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id),
        )
        .where(eq(challengeHasMountainTable.challengeId, challengeId));

      return {
        success: true,
        message: mountains,
      };
    },
    {
      query: t.Object({
        challengeId: t.Optional(t.String()),
      }),
      response: SuccessResponse(MountainsArraySchema),
    },
  );
