import { monitorEventLoopDelay } from "perf_hooks";

import { sql } from "drizzle-orm";

import { db } from "@/db";

export type HealthStatus = "healthy" | "warning" | "critical";

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message: string;
  value?: number;
}

export interface HealthSnapshot {
  status: HealthStatus;
  checks: HealthCheck[];
  uptimeMs: number;
}

const DB_TIMEOUT_MS = 2000;
const DB_WARN_MS = 500;
const DB_CRIT_MS = 2000;
const HEAP_WARN_MB = 700;
const HEAP_CRIT_MB = 900;
const RSS_WARN_MB = 1400;
const RSS_CRIT_MB = 1800;
const LAG_WARN_MS = 100;
const LAG_CRIT_MS = 500;

const loopMonitor = monitorEventLoopDelay({ resolution: 20 });
loopMonitor.enable();

const toMB = (bytes: number): number => Math.round(bytes / 1024 / 1024);

const worst = (a: HealthStatus, b: HealthStatus): HealthStatus => {
  if (a === "critical" || b === "critical") return "critical";
  if (a === "warning" || b === "warning") return "warning";
  return "healthy";
};

const checkDb = async (): Promise<HealthCheck> => {
  const start = performance.now();
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`timeout after ${DB_TIMEOUT_MS}ms`)),
          DB_TIMEOUT_MS,
        ),
      ),
    ]);
    const ms = Math.round(performance.now() - start);
    if (ms > DB_CRIT_MS) {
      return {
        name: "database",
        status: "critical",
        message: `SELECT 1 took ${ms}ms (>${DB_CRIT_MS}ms)`,
        value: ms,
      };
    }
    if (ms > DB_WARN_MS) {
      return {
        name: "database",
        status: "warning",
        message: `SELECT 1 took ${ms}ms (>${DB_WARN_MS}ms)`,
        value: ms,
      };
    }
    return {
      name: "database",
      status: "healthy",
      message: `${ms}ms`,
      value: ms,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { name: "database", status: "critical", message: msg };
  }
};

const checkHeap = (): HealthCheck => {
  const mb = toMB(process.memoryUsage().heapUsed);
  if (mb > HEAP_CRIT_MB) {
    return {
      name: "heap",
      status: "critical",
      message: `${mb}MB used (>${HEAP_CRIT_MB}MB)`,
      value: mb,
    };
  }
  if (mb > HEAP_WARN_MB) {
    return {
      name: "heap",
      status: "warning",
      message: `${mb}MB used (>${HEAP_WARN_MB}MB)`,
      value: mb,
    };
  }
  return { name: "heap", status: "healthy", message: `${mb}MB`, value: mb };
};

const checkRss = (): HealthCheck => {
  const mb = toMB(process.memoryUsage().rss);
  if (mb > RSS_CRIT_MB) {
    return {
      name: "rss",
      status: "critical",
      message: `${mb}MB (>${RSS_CRIT_MB}MB)`,
      value: mb,
    };
  }
  if (mb > RSS_WARN_MB) {
    return {
      name: "rss",
      status: "warning",
      message: `${mb}MB (>${RSS_WARN_MB}MB)`,
      value: mb,
    };
  }
  return { name: "rss", status: "healthy", message: `${mb}MB`, value: mb };
};

const checkEventLoop = (): HealthCheck => {
  const meanMs = loopMonitor.mean / 1e6;
  loopMonitor.reset();
  const ms = Math.round(meanMs);
  if (ms > LAG_CRIT_MS) {
    return {
      name: "event-loop",
      status: "critical",
      message: `mean lag ${ms}ms (>${LAG_CRIT_MS}ms)`,
      value: ms,
    };
  }
  if (ms > LAG_WARN_MS) {
    return {
      name: "event-loop",
      status: "warning",
      message: `mean lag ${ms}ms (>${LAG_WARN_MS}ms)`,
      value: ms,
    };
  }
  return {
    name: "event-loop",
    status: "healthy",
    message: `${ms}ms`,
    value: ms,
  };
};

export const runHealthCheck = async (): Promise<HealthSnapshot> => {
  const [dbCheck, heap, rss, loop] = await Promise.all([
    checkDb(),
    Promise.resolve(checkHeap()),
    Promise.resolve(checkRss()),
    Promise.resolve(checkEventLoop()),
  ]);
  const checks = [dbCheck, heap, rss, loop];
  const status = checks.reduce<HealthStatus>(
    (acc, c) => worst(acc, c.status),
    "healthy",
  );
  return {
    status,
    checks,
    uptimeMs: Math.round(process.uptime() * 1000),
  };
};
