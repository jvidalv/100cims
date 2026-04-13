import { backfillS3CacheHeaders } from "@/api/cron/backfill-s3-cache-headers";
import { cancelAbandonedPlans } from "@/api/cron/cancel-abandoned-plans";
import { cleanupOrphanMountains } from "@/api/cron/cleanup-orphan-mountains";
import { completeStalePlans } from "@/api/cron/complete-stale-plans";
import { optimizeS3Images } from "@/api/cron/optimize-s3-images";
import { syncImageUrlsToCdn } from "@/api/cron/sync-image-urls-to-cdn";
import { monitorHealth } from "@/api/cron/monitor-health";
import { recommendWeeklyMountain } from "@/api/cron/recommend-weekly-mountain";
import { dailyRestart } from "@/api/cron/self-restart";

export interface CronEntry {
  name: string;
  pattern: string;
  description: string;
  fn: () => Promise<unknown>;
}

// Format: "second minute hour day month weekday"
export const CRON_REGISTRY: CronEntry[] = [
  {
    name: "complete-stale-plans",
    pattern: "0 50 1 * * *",
    description:
      "Mark open plans whose start date was 2+ days ago as 'completed'. Runs nightly at 01:50.",
    fn: completeStalePlans,
  },
  {
    name: "daily-restart",
    pattern: "0 0 2 * * *",
    description:
      "Force the API process to exit so Railway respawns it. Clears slow-leak memory and reconnects pools. Runs nightly at 02:00.",
    fn: dailyRestart,
  },
  {
    name: "cleanup-orphan-mountains",
    pattern: "0 0 0 * * 0",
    description:
      "Delete user-created mountains that don't belong to any challenge. Runs Sunday at midnight.",
    fn: cleanupOrphanMountains,
  },
  {
    name: "backfill-s3-cache-headers",
    pattern: "0 0 4 * * 0",
    description:
      "Stamp 'Cache-Control: immutable' on any S3 object missing it. Catches uploads that escaped the upload-time header. Runs Sunday at 04:00.",
    fn: backfillS3CacheHeaders,
  },
  {
    name: "sync-image-urls-to-cdn",
    pattern: "0 30 4 * * 0",
    description:
      "Rewrite DB image_url rows still pointing at the raw S3 host to the CloudFront CDN. Idempotent. Runs Sunday at 04:30.",
    fn: syncImageUrlsToCdn,
  },
  {
    name: "monitor-health",
    pattern: "0 * * * * *",
    description:
      "Ping internal health check every minute and alert via Discord on failure.",
    fn: monitorHealth,
  },
  {
    name: "optimize-s3-images",
    pattern: "0 0 5 1,15 * *",
    description:
      "Re-encode JPEGs > 250 KB at q=80 / max 1600px wide. Marks objects 'optimized: v1' to skip re-runs. Issues one CloudFront invalidation if any object changed. Runs the 1st and 15th of each month at 05:00.",
    fn: optimizeS3Images,
  },
  {
    name: "cancel-abandoned-plans",
    pattern: "0 0 3 1 * *",
    description:
      "Cancel open plans created by non-admin users that have no start date and have been open for more than a month. Runs the 1st of each month at 03:00.",
    fn: cancelAbandonedPlans,
  },
  {
    name: "recommend-weekly-mountain",
    pattern: "0 0 17 * * 2",
    description:
      "Push the closest non-summited essential mountain to each opted-in user with recent location. Falls back to non-essential if all essentials are summited. Runs Tuesday at 17:00 UTC.",
    fn: recommendWeeklyMountain,
  },
];
