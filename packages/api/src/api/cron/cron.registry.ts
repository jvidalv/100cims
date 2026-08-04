import { backdateBulkSummits } from "@/api/cron/backdate-bulk-summits";
import { backfillS3CacheHeaders } from "@/api/cron/backfill-s3-cache-headers";
import { cancelAbandonedPlans } from "@/api/cron/cancel-abandoned-plans";
import { cleanupOrphanMountains } from "@/api/cron/cleanup-orphan-mountains";
import { completeStalePlans } from "@/api/cron/complete-stale-plans";
import { syncImageUrlsToCdn } from "@/api/cron/sync-image-urls-to-cdn";
import { monitorHealth } from "@/api/cron/monitor-health";
import { notifyUpcomingPlans } from "@/api/cron/notify-upcoming-plans";
import { recommendWeeklyMountain } from "@/api/cron/recommend-weekly-mountain";
import { weeklyRestart } from "@/api/cron/self-restart";

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
      "Mark open plans whose start date was 1+ days ago as 'completed'. Runs nightly at 01:50.",
    fn: completeStalePlans,
  },
  {
    name: "weekly-restart",
    pattern: "0 0 2 * * 1",
    description:
      "Force the API process to exit so Railway respawns it. Clears slow-leak memory and reconnects pools. Runs Monday at 02:00.",
    fn: weeklyRestart,
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
    pattern: "0 */10 * * * *",
    description:
      "Ping internal health check every 10 minutes and alert via Discord on failure.",
    fn: monitorHealth,
  },
  {
    name: "cancel-abandoned-plans",
    pattern: "0 0 3 1 * *",
    description:
      "Cancel open, non-private plans created by non-admin users that have no start date and have been open for more than a month. Runs the 1st of each month at 03:00.",
    fn: cancelAbandonedPlans,
  },
  {
    name: "notify-upcoming-plans",
    pattern: "0 0 10 * * *",
    description:
      "Push a reminder to every roster member of non-canceled plans whose start date is exactly 2 days out. Runs daily at 10:00 UTC (~12:00 Spain).",
    fn: notifyUpcomingPlans,
  },
  {
    name: "recommend-weekly-mountain",
    pattern: "0 0 17 * * 2",
    description:
      "Push the closest non-summited mountain (essential or not) from the user's active challenge to each opted-in user with recent location, with their challenge progress. Runs Tuesday at 17:00 UTC.",
    fn: recommendWeeklyMountain,
  },
  {
    name: "backdate-bulk-summits",
    pattern: "0 */30 * * * *",
    description:
      "Detect bulk summit uploads (same user+date, 5+ unedited rows, created in the last 7 days) and shift them 5 years back to stop polluting the recent feed. Idempotent: once backdated, rows no longer match the filter. Runs every 30 minutes.",
    fn: backdateBulkSummits,
  },
];
