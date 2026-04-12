import { Elysia, t } from "elysia";

import { db } from "@/db";
import { donorTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const donorCreatePostRoute = new Elysia().post(
  "/",
  async ({ request, body, set }) => {
    const user = getUserFromRequest(request);

    if (!body.quantity) {
      set.status = 400;
      return { success: false };
    }

    const quantity = Number.parseFloat(body.quantity);

    if (quantity <= 0) {
      set.status = 400;
      return { success: false };
    }

    await db.insert(donorTable).values({
      userId: user.id,
      donation: body.quantity,
    });

    return {
      success: true,
    };
  },
  {
    body: t.Object({
      quantity: t.String(),
    }),
    response: {
      400: t.Object({
        success: t.Boolean(),
      }),
      200: t.Object({
        success: t.Boolean(),
      }),
    },
  },
);
