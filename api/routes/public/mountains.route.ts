import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import { mountainTable } from "@/api/db/schema";

export const mountainsRoute = new Elysia({ prefix: "/mountains" }).get(
  "/all",
  async () => {
    const mountains = await db.select().from(mountainTable);

    return {
      success: true,
      message: mountains,
    };
  },
  {
    response: t.Object({
      success: t.Boolean(),
      message: t.Array(
        t.Object({
          id: t.String(),
          name: t.String(),
          slug: t.String(),
          location: t.String(),
          essential: t.Boolean(),
          height: t.String(),
          latitude: t.String(),
          longitude: t.String(),
          url: t.String(),
          imageUrl: t.Nullable(t.String()),
        }),
      ),
    }),
  },
);
