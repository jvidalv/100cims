/**
 * Read-only: scan the public bucket and report size distribution + the largest
 * objects. No mutation.
 *
 *   yarn tsx scripts/list-large-s3-objects.ts
 */
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import "dotenv/config";

import { getS3Client } from "@/api/routes/@shared/s3";

const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
const prefix = process.env.APP_NAME ? `${process.env.APP_NAME}/` : "";

if (!Bucket) {
  console.error("Missing AWS_PUBLIC_BUCKET_NAME env");
  process.exit(1);
}

const KB = 1024;
const MB = 1024 * KB;
const BUCKETS = [
  { label: "< 100 KB", max: 100 * KB },
  { label: "100-200 KB", max: 200 * KB },
  { label: "200-400 KB", max: 400 * KB },
  { label: "400-800 KB", max: 800 * KB },
  { label: "800 KB - 1 MB", max: 1 * MB },
  { label: "1-2 MB", max: 2 * MB },
  { label: "2-5 MB", max: 5 * MB },
  { label: "> 5 MB", max: Infinity },
];

const fmt = (n: number) =>
  n >= MB ? `${(n / MB).toFixed(2)} MB` : `${(n / KB).toFixed(1)} KB`;

const main = async () => {
  const client = getS3Client();
  const counts = new Array(BUCKETS.length).fill(0);
  const totalBytesPerBucket = new Array(BUCKETS.length).fill(0);
  const largest: { key: string; size: number }[] = [];

  let continuation: string | undefined;
  let scanned = 0;
  let total = 0;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuation,
      }),
    );
    for (const obj of page.Contents ?? []) {
      if (!obj.Key || obj.Size == null) continue;
      scanned++;
      total += obj.Size;
      const idx = BUCKETS.findIndex((b) => obj.Size! <= b.max);
      counts[idx]++;
      totalBytesPerBucket[idx] += obj.Size;
      if (largest.length < 20 || obj.Size > largest[largest.length - 1].size) {
        largest.push({ key: obj.Key, size: obj.Size });
        largest.sort((a, b) => b.size - a.size);
        largest.length = Math.min(largest.length, 20);
      }
    }
    continuation = page.NextContinuationToken;
  } while (continuation);

  console.log(`\nScanned ${scanned} objects, ${fmt(total)} total\n`);
  console.log("size bucket".padEnd(18) + "count".padStart(8) + "  bytes");
  console.log("-".repeat(45));
  for (let i = 0; i < BUCKETS.length; i++) {
    console.log(
      BUCKETS[i].label.padEnd(18) +
        String(counts[i]).padStart(8) +
        `  ${fmt(totalBytesPerBucket[i])}`,
    );
  }
  console.log("\nTop 20 largest objects:");
  console.log("-".repeat(80));
  for (const { key, size } of largest) {
    console.log(`${fmt(size).padStart(12)}  ${key}`);
  }
  process.exit(0);
};

void main();
