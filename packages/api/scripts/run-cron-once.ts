/**
 * Manually invoke a cron job once, outside its schedule.
 *
 * Each cron in src/api/cron/ guards itself with `if (NODE_ENV !== "production")`
 * so it can't accidentally fire while you're running `yarn api dev`. To run one
 * by hand you must opt in by setting NODE_ENV explicitly on the command line:
 *
 *   NODE_ENV=production yarn tsx scripts/run-cron-once.ts <backfill|sync>
 *
 * WARNING: this hits whatever S3 bucket and Postgres DB are configured in the
 * loaded env (.env.local by default — that's your dev resources). Double-check
 * AWS_PUBLIC_BUCKET_NAME and DATABASE_URL before invoking.
 */
import "dotenv/config";

import { backfillS3CacheHeaders } from "@/api/cron/backfill-s3-cache-headers";
import { syncImageUrlsToCdn } from "@/api/cron/sync-image-urls-to-cdn";

const USAGE =
  "usage: NODE_ENV=production yarn tsx scripts/run-cron-once.ts <backfill|sync>";

if (process.env.NODE_ENV !== "production") {
  console.error(
    "❌ NODE_ENV must be set to 'production' to run a cron manually.\n" +
      "   Crons no-op outside production as a safety guard. Re-invoke as:\n" +
      `   ${USAGE}\n` +
      "   Confirm AWS_PUBLIC_BUCKET_NAME / DATABASE_URL point at the resources\n" +
      "   you intend to mutate.",
  );
  process.exit(1);
}

const which = process.argv[2];

const main = async () => {
  if (which === "backfill") {
    await backfillS3CacheHeaders();
  } else if (which === "sync") {
    await syncImageUrlsToCdn();
  } else {
    console.error(USAGE);
    process.exit(1);
  }
  process.exit(0);
};

void main();
