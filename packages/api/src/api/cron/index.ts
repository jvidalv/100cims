import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";

import { CRON_REGISTRY } from "@/api/cron/cron.registry";

const running = new Set<string>();

function runCron(name: string, fn: () => Promise<unknown>) {
  return async () => {
    if (running.has(name)) return;
    running.add(name);
    try {
      await fn();
    } catch (error) {
      console.error(`[cron:${name}] failed`, error);
    } finally {
      running.delete(name);
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cron plugin mutates Elysia generics on each .use()
let jobs: any = new Elysia({ name: "cron-jobs" });

for (const entry of CRON_REGISTRY) {
  jobs = jobs.use(
    cron({
      name: entry.name,
      pattern: entry.pattern,
      run: runCron(entry.name, entry.fn),
    }),
  );
}

export const cronJobs: Elysia = jobs;
