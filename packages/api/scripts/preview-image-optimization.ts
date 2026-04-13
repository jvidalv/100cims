/**
 * Dry-run preview: take the N largest mountain images from the bucket,
 * re-encode them locally with sharp, write the optimized versions to /tmp,
 * and print a before/after comparison. NO S3 MUTATION.
 *
 *   yarn tsx scripts/preview-image-optimization.ts
 */
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import "dotenv/config";

import { db } from "@/db";
import { mountainTable } from "@/db/schema";
import { isNotNull, sql } from "drizzle-orm";

import { getS3Client } from "@/api/routes/@shared/s3";

const SAMPLE_SIZE = 5;
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const TARGET_BYTES = 800 * 1024;

const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
const cdn = process.env.AWS_PUBLIC_CDN_URL?.replace(/\/$/, "");

if (!Bucket || !cdn) {
  console.error("Missing AWS_PUBLIC_BUCKET_NAME or AWS_PUBLIC_CDN_URL env");
  process.exit(1);
}

const main = async () => {
  const client = getS3Client();
  const outDir = join(tmpdir(), "cims-image-preview");
  mkdirSync(outDir, { recursive: true });

  // Find mountains whose image is hosted on the CDN; we'll then probe S3 for size.
  // Easier: just sample N mountain image_urls and HEAD each via S3 to get size.
  // Since DB rows now have CDN URLs, derive the S3 key from the URL path.
  const rows = await db
    .select({ id: mountainTable.id, name: mountainTable.name, imageUrl: mountainTable.imageUrl })
    .from(mountainTable)
    .where(isNotNull(mountainTable.imageUrl))
    .orderBy(sql`random()`)
    .limit(50); // oversample, then keep the 5 biggest

  const sized: {
    row: (typeof rows)[number];
    key: string;
    size: number;
    buf: Buffer;
  }[] = [];
  for (const row of rows) {
    if (!row.imageUrl) continue;
    const key = new URL(row.imageUrl).pathname.replace(/^\//, "");
    try {
      const obj = await client.send(new GetObjectCommand({ Bucket, Key: key }));
      if (!obj.Body) continue;
      const bytes = await obj.Body.transformToByteArray();
      const buf = Buffer.from(bytes);
      sized.push({ row, key, size: buf.byteLength, buf });
    } catch (e) {
      console.error(`! failed to fetch ${key}:`, e);
    }
  }

  sized.sort((a, b) => b.size - a.size);
  const top = sized.slice(0, SAMPLE_SIZE);

  const fmt = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  const pct = (a: number, b: number) => `${(((a - b) / a) * 100).toFixed(0)}%`;

  console.log(
    `Sampled ${rows.length} mountains, optimizing top ${SAMPLE_SIZE} by size:\n`,
  );
  console.log(
    "name".padEnd(28) +
      "before".padStart(12) +
      "after".padStart(12) +
      "saved".padStart(8) +
      "  files",
  );
  console.log("-".repeat(80));

  for (const { row, size, buf: original } of top) {
    const optimized = await sharp(original)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
      .toBuffer();

    const safeName = row.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const beforePath = join(outDir, `${safeName}.before.jpg`);
    const afterPath = join(outDir, `${safeName}.after.jpg`);
    writeFileSync(beforePath, original);
    writeFileSync(afterPath, optimized);

    const flag = optimized.length > TARGET_BYTES ? " ⚠" : "";
    console.log(
      row.name.slice(0, 27).padEnd(28) +
        fmt(size).padStart(12) +
        fmt(optimized.length).padStart(12) +
        pct(size, optimized.length).padStart(8) +
        flag +
        `  ${beforePath}\n${"".padEnd(60)}  ${afterPath}`,
    );
  }

  console.log(`\nFiles saved to ${outDir}`);
  console.log(`Open with:  open ${outDir}`);
  process.exit(0);
};

void main();
