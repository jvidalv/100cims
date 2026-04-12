import { Elysia, t } from "elysia";

import { CRON_REGISTRY } from "@/api/cron/cron.registry";

export const adminCronsTriggerPostRoute = new Elysia().post(
  "/crons/:name/trigger",
  async ({ params, set }) => {
    const entry = CRON_REGISTRY.find((e) => e.name === params.name);
    if (!entry) {
      set.status = 404;
      return { error: "Cron not found" };
    }
    const start = Date.now();
    await entry.fn();
    const durationMs = Date.now() - start;
    return { success: true, name: entry.name, durationMs };
  },
  {
    params: t.Object({ name: t.String() }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        name: t.String(),
        durationMs: t.Number(),
      }),
      404: t.Object({ error: t.String() }),
    },
  },
);
