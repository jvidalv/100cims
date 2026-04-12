import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { resolveCountryFromRequest } from "@/api/lib/geoip";
import {
  resolveAppVersionFromRequest,
  resolvePlatformFromRequest,
} from "@/api/lib/request-headers";
import { addRowToSheets, EMAILS_SPREADSHEET } from "@/api/lib/sheets";
import { DEFAULT_CHALLENGE_ID } from "@/api/routes/@shared/challenge";
import { JWT } from "@/api/routes/@shared/jwt";
import { AuthSuccessSchema, AuthErrorSchema } from "@/api/schemas/auth.schema";

// JWTs use base64url; payload bytes are UTF-8 — atob alone produces a
// binary string that double-encodes non-ASCII characters (é → Ã©).
const decodeJwtPayload = (token: string): Record<string, string> => {
  const [, payload] = token.split(".");
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const getAppleEmailFromIdentityToken = (identityToken: string): string => {
  return decodeJwtPayload(identityToken).email;
};

const getGoogleDataFromIdToken = (
  idToken: string,
): {
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
} | null => {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = decodeJwtPayload(idToken);
    return {
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
};

export const joinPostRoute = new Elysia().use(JWT()).post(
  "/join",
  async ({ jwt, body, request, set }) => {
    let email;
    let firstName;
    let lastName;
    let imageUrl;

    if (body.provider === "apple") {
      email = getAppleEmailFromIdentityToken(body.identityToken);
      firstName = body.firstName;
      lastName = body.lastName;
    }

    if (body.provider === "google") {
      // Try to decode as JWT (idToken) first
      const jwtData = getGoogleDataFromIdToken(body.identityToken);

      if (jwtData) {
        // Successfully decoded JWT - use the data directly
        email = jwtData.email;
        firstName = jwtData.given_name;
        lastName = jwtData.family_name;
        imageUrl = jwtData.picture;
      } else {
        // Not a JWT - fall back to API call (backwards compatibility for access_token)
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${body.identityToken}`,
        );
        const json = (await response.json()) as {
          email: string;
          given_name: string;
          last_name: string;
          family_name: string;
          picture: string;
        };

        if (!json.email) {
          set.status = 500;
          return {
            success: false,
            message: "Invalid google email address",
          };
        }

        email = json.email;
        firstName = json.given_name;
        lastName = json.family_name || json.last_name;
        imageUrl = json.picture;
      }
    }

    if (!email) {
      set.status = 500;
      return { success: false, message: "Invalid email address" };
    }

    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));

    const country = resolveCountryFromRequest(request);
    const platform = resolvePlatformFromRequest(request);
    const appVersion = resolveAppVersionFromRequest(request);

    let user = users?.[0];
    if (!user) {
      try {
        void addRowToSheets(EMAILS_SPREADSHEET, [email, firstName, lastName]);
      } catch {
        // noop
      }
      const insert = await db
        .insert(userTable)
        .values({
          email: email,
          firstName: firstName,
          lastName: lastName,
          imageUrl: imageUrl,
          locale: body.locale,
          country,
          platform,
          appVersion,
          activeChallengeId: DEFAULT_CHALLENGE_ID,
        })
        .returning();
      user = insert[0];
    } else {
      const updates: Partial<typeof userTable.$inferInsert> = {};
      if (!user.country && country) updates.country = country;
      if (!user.platform && platform) updates.platform = platform;
      if (appVersion) updates.appVersion = appVersion;
      if (Object.keys(updates).length) {
        await db
          .update(userTable)
          .set(updates)
          .where(eq(userTable.id, user.id));
      }
    }

    const hash = await jwt.sign({
      id: user.id,
      email: user.email,
    });

    return {
      success: true,
      message: hash,
    };
  },
  {
    body: t.Object({
      provider: t.Enum({ apple: "apple", google: "google" }),
      identityToken: t.String(),
      firstName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
      locale: t.Optional(t.String()),
    }),
    response: {
      200: AuthSuccessSchema,
      500: AuthErrorSchema,
    },
  },
);
