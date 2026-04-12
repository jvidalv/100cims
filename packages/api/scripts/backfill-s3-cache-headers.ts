/**
 * One-off: stamp `Cache-Control: public, max-age=31536000, immutable` on every
 * existing object in the public S3 bucket. Uses copy-in-place so no bytes are
 * re-uploaded.
 *
 * Run locally with credentials from packages/api/.env.local:
 *   cd packages/api && yarn tsx scripts/backfill-s3-cache-headers.ts
 *
 * Safe to re-run: CopyObject with REPLACE is idempotent.
 */
import {
  CopyObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import "dotenv/config";

const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.MY_AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_ACCESS_SECRET_KEY;
const prefix = process.env.APP_NAME ? `${process.env.APP_NAME}/` : "";

if (!Bucket || !region || !accessKeyId || !secretAccessKey) {
  console.error(
    "Missing env: need AWS_PUBLIC_BUCKET_NAME, AWS_BUCKET_REGION, MY_AWS_ACCESS_KEY, AWS_ACCESS_SECRET_KEY",
  );
  process.exit(1);
}

const client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const CacheControl = "public, max-age=31536000, immutable";

let continuation: string | undefined;
let updated = 0;
let scanned = 0;

console.log(`Scanning s3://${Bucket}/${prefix} …`);

do {
  const page = await client.send(
    new ListObjectsV2Command({
      Bucket,
      Prefix: prefix || undefined,
      ContinuationToken: continuation,
    }),
  );
  for (const obj of page.Contents ?? []) {
    if (!obj.Key) continue;
    scanned++;
    try {
      await client.send(
        new CopyObjectCommand({
          Bucket,
          Key: obj.Key,
          CopySource: `${Bucket}/${encodeURIComponent(obj.Key)}`,
          MetadataDirective: "REPLACE",
          CacheControl,
          ContentType: "image/jpeg",
        }),
      );
      updated++;
      if (updated % 50 === 0) {
        console.log(`  … ${updated} updated (${scanned} scanned)`);
      }
    } catch (e) {
      console.error(`  ! failed on ${obj.Key}:`, e);
    }
  }
  continuation = page.NextContinuationToken;
} while (continuation);

console.log(`Done. Updated ${updated} of ${scanned} objects.`);
