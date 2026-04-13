import {
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import sharp from "sharp";

import { mapWithConcurrency } from "@/api/cron/lib/concurrent";
import { getS3Client, IMAGE_CACHE_CONTROL } from "@/api/routes/@shared/s3";

const MIN_BYTES = 250 * 1024;
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const CONCURRENCY = 10;
const OPTIMIZED_MARKER_KEY = "optimized";
const OPTIMIZED_MARKER_VALUE = "v1";

export async function optimizeS3Images(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[optimize-s3-images] skipped (non-production)");
    return;
  }

  const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
  const distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
  const region = process.env.AWS_BUCKET_REGION;
  const prefix = process.env.APP_NAME ? `${process.env.APP_NAME}/` : "";

  if (!Bucket || !distributionId || !region) {
    console.warn("[optimize-s3-images] missing env, skipping");
    return;
  }

  const s3 = getS3Client();
  const cloudfront = new CloudFrontClient({
    region,
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY!,
    },
  });

  let continuation: string | undefined;
  let scanned = 0;
  let optimized = 0;
  let skipped = 0;
  let failed = 0;
  let bytesSaved = 0;

  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuation,
      }),
    );
    const candidates = (page.Contents ?? []).filter(
      (o) => o.Key && o.Size != null && o.Size >= MIN_BYTES,
    );
    scanned += candidates.length;

    await mapWithConcurrency(candidates, CONCURRENCY, async (obj) => {
      const Key = obj.Key!;
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket, Key }));
        if (head.Metadata?.[OPTIMIZED_MARKER_KEY] === OPTIMIZED_MARKER_VALUE) {
          skipped++;
          return;
        }
        if (head.ContentType !== "image/jpeg") {
          skipped++;
          return;
        }

        const got = await s3.send(new GetObjectCommand({ Bucket, Key }));
        const original = Buffer.from(await got.Body!.transformToByteArray());

        const out = await sharp(original)
          .rotate()
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({
            quality: JPEG_QUALITY,
            mozjpeg: true,
            progressive: true,
          })
          .toBuffer();

        if (out.length >= original.length) {
          await s3.send(
            new CopyObjectCommand({
              Bucket,
              Key,
              CopySource: `${Bucket}/${encodeURIComponent(Key)}`,
              MetadataDirective: "REPLACE",
              ContentType: "image/jpeg",
              CacheControl: IMAGE_CACHE_CONTROL,
              Metadata: {
                [OPTIMIZED_MARKER_KEY]: OPTIMIZED_MARKER_VALUE,
              },
            }),
          );
          skipped++;
          return;
        }

        await s3.send(
          new PutObjectCommand({
            Bucket,
            Key,
            Body: out,
            ContentType: "image/jpeg",
            CacheControl: IMAGE_CACHE_CONTROL,
            Metadata: {
              [OPTIMIZED_MARKER_KEY]: OPTIMIZED_MARKER_VALUE,
            },
          }),
        );
        optimized++;
        bytesSaved += original.length - out.length;
      } catch (e) {
        failed++;
        console.error(`[optimize-s3-images] failed on ${Key}:`, e);
      }
    });

    continuation = page.NextContinuationToken;
  } while (continuation);

  console.log(
    `[optimize-s3-images] scanned ${scanned}, optimized ${optimized}, ` +
      `skipped ${skipped}, failed ${failed}, saved ${(bytesSaved / 1024 / 1024).toFixed(1)} MB`,
  );

  if (optimized > 0) {
    try {
      await cloudfront.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: `optimize-s3-images-${Date.now()}`,
            Paths: { Quantity: 1, Items: ["/*"] },
          },
        }),
      );
      console.log("[optimize-s3-images] CloudFront invalidation issued");
    } catch (e) {
      console.error("[optimize-s3-images] CloudFront invalidation failed:", e);
    }
  }
}
