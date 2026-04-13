import { Elysia, t } from "elysia";

import { runHealthCheck } from "@/api/lib/health";

const HealthStatusSchema = t.Union([
  t.Literal("healthy"),
  t.Literal("warning"),
  t.Literal("critical"),
]);

const HealthCheckSchema = t.Object({
  name: t.String(),
  status: HealthStatusSchema,
  message: t.String(),
  value: t.Optional(t.Number()),
});

const HealthSnapshotSchema = t.Object({
  status: HealthStatusSchema,
  checks: t.Array(HealthCheckSchema),
  uptimeMs: t.Number(),
});

export const healthGetRoute = new Elysia().get(
  "/health",
  async ({ set }) => {
    const snapshot = await runHealthCheck();
    if (snapshot.status === "critical") set.status = 503;
    return snapshot;
  },
  {
    response: {
      200: HealthSnapshotSchema,
      503: HealthSnapshotSchema,
    },
  },
);
