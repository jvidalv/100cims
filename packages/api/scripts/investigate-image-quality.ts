/**
 * Read-only investigation: for a sample of recent summit photos, report
 * before/after sizes and PSNR across a matrix of sharp encode settings.
 * Goal: find the sweet spot between size and perceived quality so we can
 * tune both the mobile client (expo-image-manipulator) and the server
 * optimize cron.
 *
 *   yarn tsx scripts/investigate-image-quality.ts
 */
import { GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import "dotenv/config";

import { getS3Client } from "@/api/routes/@shared/s3";
import { db } from "@/db";
import { summitTable } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";

const Bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
if (!Bucket) {
  console.error("Missing AWS_PUBLIC_BUCKET_NAME");
  process.exit(1);
}

const SAMPLES = 8;
const MATRIX: { label: string; width: number; quality: number }[] = [
  { label: "current-cron (1600@q80)", width: 1600, quality: 80 },
  { label: "milder     (1920@q82)", width: 1920, quality: 82 },
  { label: "milder+    (1920@q85)", width: 1920, quality: 85 },
  { label: "mid        (1600@q85)", width: 1600, quality: 85 },
  { label: "smaller    (1200@q82)", width: 1200, quality: 82 },
];

// Decode two buffers to raw RGB and return PSNR (dB). Higher = closer.
// Both inputs are rendered at the same dims (smaller of the two) for fairness.
const psnr = async (a: Buffer, b: Buffer): Promise<number> => {
  const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  const w = Math.min(ma.width ?? 0, mb.width ?? 0);
  const h = Math.min(ma.height ?? 0, mb.height ?? 0);
  if (!w || !h) return 0;
  const [rawA, rawB] = await Promise.all([
    sharp(a).resize(w, h).removeAlpha().raw().toBuffer(),
    sharp(b).resize(w, h).removeAlpha().raw().toBuffer(),
  ]);
  const n = Math.min(rawA.length, rawB.length);
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const d = rawA[i] - rawB[i];
    sse += d * d;
  }
  const mse = sse / n;
  if (mse === 0) return Infinity;
  return 10 * Math.log10((255 * 255) / mse);
};

const fmtKb = (n: number) => `${(n / 1024).toFixed(0).padStart(4)}KB`;
const fmtDb = (n: number) =>
  n === Infinity ? " ∞  dB" : `${n.toFixed(1).padStart(4)}dB`;

async function main() {
  const client = getS3Client();
  const rows = await db
    .select({ imageUrl: summitTable.imageUrl })
    .from(summitTable)
    .where(isNotNull(summitTable.imageUrl))
    .orderBy(desc(summitTable.createdAt))
    .limit(SAMPLES);

  console.log(`Analyzing ${rows.length} recent summit photos.\n`);

  const totals = new Map<string, { bytesSaved: number; psnrSum: number }>();
  for (const { label } of MATRIX) totals.set(label, { bytesSaved: 0, psnrSum: 0 });

  for (const row of rows) {
    if (!row.imageUrl) continue;
    const Key = new URL(row.imageUrl).pathname.replace(/^\//, "");
    let original: Buffer;
    try {
      const obj = await client.send(new GetObjectCommand({ Bucket, Key }));
      if (!obj.Body) continue;
      original = Buffer.from(await obj.Body.transformToByteArray());
    } catch {
      continue;
    }
    const origMeta = await sharp(original).metadata();
    console.log(
      `=== ${Key.split("/").pop()} — ${fmtKb(original.length)} ${origMeta.width}×${origMeta.height} ===`,
    );

    for (const { label, width, quality } of MATRIX) {
      const out = await sharp(original)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true, progressive: true })
        .toBuffer();
      const q = await psnr(original, out);
      const deltaPct = (
        ((out.length - original.length) / original.length) *
        100
      ).toFixed(0);
      console.log(
        `  ${label.padEnd(25)}  ${fmtKb(out.length)}  (${deltaPct.padStart(3)}%)  PSNR ${fmtDb(q)}`,
      );
      const bucket = totals.get(label);
      if (bucket) {
        bucket.bytesSaved += original.length - out.length;
        bucket.psnrSum += q === Infinity ? 60 : q;
      }
    }
    console.log();
  }

  console.log("=== Summary across samples ===");
  console.log(
    "setting".padEnd(25) + "  avg bytes saved / image  avg PSNR",
  );
  for (const { label } of MATRIX) {
    const t = totals.get(label);
    if (!t) continue;
    const avgSaved = t.bytesSaved / rows.length;
    const avgPsnr = t.psnrSum / rows.length;
    console.log(
      `  ${label.padEnd(25)}  ${fmtKb(avgSaved)}            ${avgPsnr.toFixed(1)}dB`,
    );
  }
  process.exit(0);
}

void main();
