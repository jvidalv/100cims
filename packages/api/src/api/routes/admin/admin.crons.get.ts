import { Elysia, t } from "elysia";

import { CRON_REGISTRY } from "@/api/cron/cron.registry";

export const adminCronsGetRoute = new Elysia().get(
  "/crons",
  () => {
    return {
      success: true,
      message: CRON_REGISTRY.map((entry) => ({
        name: entry.name,
        pattern: entry.pattern,
      })),
    };
  },
  {
    response: t.Object({
      success: t.Boolean(),
      message: t.Array(
        t.Object({ name: t.String(), pattern: t.String() }),
      ),
    }),
  },
);
