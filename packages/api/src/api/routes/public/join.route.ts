import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { addRowToSheets, EMAILS_SPREADSHEET } from "@/api/lib/sheets";
import { JWT } from "@/api/routes/@shared/jwt";
import { AuthSuccessSchema, AuthErrorSchema } from "@/api/schemas/auth.schema";

const getAppleEmailFromIdentityToken = (identityToken: string): string => {
  const [, payload] = identityToken.split(".");
  const decodedPayload = JSON.parse(atob(payload));
  return decodedPayload.email;
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
    if (parts.length !== 3) {
      // Not a JWT, probably an access token
      return null;
    }
    const [, payload] = parts;
    const decodedPayload = JSON.parse(atob(payload));
    return {
      email: decodedPayload.email,
      given_name: decodedPayload.given_name,
      family_name: decodedPayload.family_name,
      picture: decodedPayload.picture,
    };
  } catch {
    // Failed to decode, not a valid JWT
    return null;
  }
};

export const joinRoute = new Elysia().use(JWT()).post(
  "/join",
  async ({ jwt, body, set }) => {
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
        })
        .returning();
      user = insert[0];
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
