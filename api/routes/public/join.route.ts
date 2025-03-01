import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import { userTable } from "@/api/db/schema";
import { addRowToSheets, EMAILS_SPREADSHEET } from "@/api/lib/sheets";
import { JWT } from "@/api/routes/@shared/jwt";

const getAppleEmailFromIdentityToken = (identityToken: string): string => {
  const [, payload] = identityToken.split(".");
  const decodedPayload = JSON.parse(atob(payload));
  return decodedPayload.email;
};

export const joinRoute = new Elysia().use(JWT()).post(
  "/join",
  async ({ jwt, body, error }) => {
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
        return error(500, {
          success: false,
          message: "Invalid google email address",
        });
      }

      email = json.email;
      firstName = json.given_name;
      lastName = json.family_name || json.last_name;
      imageUrl = json.picture;
    }

    if (!email) {
      return error(500, { success: false, message: "Invalid email address" });
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
    }),
  },
);
