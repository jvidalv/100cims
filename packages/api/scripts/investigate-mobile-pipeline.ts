/**
 * Read-only: simulate the mobile image pipeline's aggression.
 *
 * Takes the 3 largest summit photos as proxies for "original phone photo"
 * (they're already client-compressed but they're the best approximation
 * we have of real user output) and runs each through a matrix of mobile
 * encode settings to show the quality/size trade. Each result is then
 * ALSO put through the current server cron settings to show the cumulative
 * loss when both passes run.
 *
 *   yarn tsx scripts/investigate-mobile-pipeline.ts
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

// Mobile settings matrix — (resizeBy, quality) pairs from expo-image-manipulator.
const MOBILE: { label: string; resizeBy: number; quality: number }[] = [
  { label: "current (÷3 @ q80)", resizeBy: 3, quality: 80 },
  { label: "less-shrink (÷2 @ q80)", resizeBy: 2, quality: 80 },
  { label: "target-max (1600 @ q82)", resizeBy: 0, quality: 82 }, // 0 = width cap instead
  { label: "target-max (1920 @ q85)", resizeBy: 0, quality: 85 },
];

const CRON_WIDTH = 1600;
const CRON_QUALITY = 85; // the milder cron we'd move to

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
  // Take the 3 largest recent summit photos — they approximate "raw upload".
  const rows = await db
    .select({ imageUrl: summitTable.imageUrl })
    .from(summitTable)
    .where(isNotNull(summitTable.imageUrl))
    .orderBy(desc(summitTable.createdAt))
    .limit(30);

  const candidates: { key: string; bytes: Buffer }[] = [];
  for (const r of rows) {
    if (!r.imageUrl) continue;
    const Key = new URL(r.imageUrl).pathname.replace(/^\//, "");
    try {
      const obj = await client.send(new GetObjectCommand({ Bucket, Key }));
      if (!obj.Body) continue;
      const buf = Buffer.from(await obj.Body.transformToByteArray());
      candidates.push({ key: Key, bytes: buf });
    } catch {
      // skip
    }
  }
  candidates.sort((a, b) => b.bytes.length - a.bytes.length);
  const top = candidates.slice(0, 3);

  console.log(
    `Testing ${top.length} largest recent summit photos as "originals".\n` +
      `Server cron simulated as width≤${CRON_WIDTH}, q=${CRON_QUALITY} mozjpeg.\n`,
  );

  for (const { key, bytes: original } of top) {
    const origMeta = await sharp(original).metadata();
    console.log(
      `=== ${key.split("/").pop()} — ${fmtKb(original.length)} ${origMeta.width}×${origMeta.height} ===`,
    );

    for (const { label, resizeBy, quality } of MOBILE) {
      // Step 1: simulate mobile encode.
      let mobileStep = sharp(original).rotate();
      if (resizeBy > 1) {
        mobileStep = mobileStep.resize({
          width: Math.floor((origMeta.width ?? 1) / resizeBy),
        });
      } else if (resizeBy === 0) {
        // width-cap mode
        mobileStep = mobileStep.resize({
          width: label.includes("1920") ? 1920 : 1600,
          withoutEnlargement: true,
        });
      }
      const afterMobile = await mobileStep
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      // Step 2: run it through the server cron.
      const afterCron = await sharp(afterMobile)
        .rotate()
        .resize({ width: CRON_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: CRON_QUALITY, mozjpeg: true, progressive: true })
        .toBuffer();

      const qMobile = await psnr(original, afterMobile);
      const qFinal = await psnr(original, afterCron);
      console.log(
        `  ${label.padEnd(26)}  mobile ${fmtKb(afterMobile.length)} ${fmtDb(qMobile)}   → after cron ${fmtKb(afterCron.length)} ${fmtDb(qFinal)}`,
      );
    }
    console.log();
  }
  process.exit(0);
}

void main();
