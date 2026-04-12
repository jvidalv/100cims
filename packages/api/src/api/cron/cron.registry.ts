import { completeStalePlans } from "@/api/cron/complete-stale-plans";
import { dailyRestart } from "@/api/cron/self-restart";

export interface CronEntry {
  name: string;
  pattern: string;
  fn: () => Promise<unknown>;
}

// Format: "second minute hour day month weekday"
export const CRON_REGISTRY: CronEntry[] = [
  {
    name: "complete-stale-plans",
    pattern: "0 50 1 * * *",
    fn: completeStalePlans,
  },
  { name: "daily-restart", pattern: "0 0 2 * * *", fn: dailyRestart },
];
