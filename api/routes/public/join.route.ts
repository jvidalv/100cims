import { Elysia, t } from "elysia";
import { JWT } from "@/api/routes/@shared/jwt";
import { db } from "@/api/db";
import { userTable } from "@/api/db/schema";
import { eq } from "drizzle-orm";

const getAppleEmailFromIdentityToken = (identityToken: string): string => {
  const [_, payload] = identityToken.split(".");

  const decodedPayload = JSON.parse(atob(payload));

  return decodedPayload.email;
};

export const joinRoute = new Elysia().use(JWT()).post(
  "/join",
  async ({ jwt, body, set, error }) => {
    let email;
    if (body.provider === "apple") {
      email = getAppleEmailFromIdentityToken(body.identityToken);
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
      const insert = await db
        .insert(userTable)
        .values({
          email: email,
          firstName: body.firstName,
          lastName: body.lastName,
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
    response: {
      500: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
    body: t.Object({
      provider: t.Enum({ apple: "apple", google: "google" }),
      identityToken: t.String(),
      firstName: t.Nullable(t.String()),
      lastName: t.Nullable(t.String()),
    }),
  },
);
