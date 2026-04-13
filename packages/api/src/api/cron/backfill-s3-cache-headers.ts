import {
  CopyObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { mapWithConcurrency } from "@/api/cron/lib/concurrent";
import { getS3Client, IMAGE_CACHE_CONTROL } from "@/api/routes/@shared/s3";

const CONCURRENCY = 10;

export async function backfillS3CacheHeaders(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[backfill-s3-cache-headers] skipped (non-production)");
    return;
  }

  const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
  const prefix = process.env.APP_NAME ? `${process.env.APP_NAME}/` : "";

  if (!Bucket) {
    console.warn("[backfill-s3-cache-headers] missing AWS_PUBLIC_BUCKET_NAME");
    return;
  }

  const client = getS3Client();

  let continuation: string | undefined;
  let updated = 0;
  let scanned = 0;
  let failed = 0;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuation,
      }),
    );
    const keys = (page.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k));
    scanned += keys.length;

    const results = await mapWithConcurrency(keys, CONCURRENCY, async (Key) => {
      try {
        const head = await client.send(new HeadObjectCommand({ Bucket, Key }));
        if (head.CacheControl === IMAGE_CACHE_CONTROL) return "skip";
        await client.send(
          new CopyObjectCommand({
            Bucket,
            Key,
            CopySource: `${Bucket}/${encodeURIComponent(Key)}`,
            MetadataDirective: "REPLACE",
            CacheControl: IMAGE_CACHE_CONTROL,
            ContentType: head.ContentType ?? "application/octet-stream",
          }),
        );
        return "updated";
      } catch (e) {
        console.error(`[backfill-s3-cache-headers] failed on ${Key}:`, e);
        return "failed";
      }
    });
    updated += results.filter((r) => r === "updated").length;
    failed += results.filter((r) => r === "failed").length;

    continuation = page.NextContinuationToken;
  } while (continuation);

  console.log(
    `[backfill-s3-cache-headers] scanned ${scanned}, updated ${updated}, failed ${failed}`,
  );
}
