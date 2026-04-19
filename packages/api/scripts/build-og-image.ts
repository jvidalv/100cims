/**
 * Generate public/assets/og-image.jpg — a 1200×630 JPEG with the brand logo
 * centered on a solid black background. Used for every Open Graph preview on
 * social platforms (Telegram, WhatsApp, iMessage, X, Slack, Discord, …).
 *
 * Why not point `og:image` at logo.png directly: logo.png is transparent +
 * white ink, so platforms that render it on a light background (or compose it
 * without handling alpha) produce an empty white rectangle (see Telegram).
 * Baking the logo onto an opaque black card removes the ambiguity.
 *
 * Usage:
 *   yarn tsx scripts/build-og-image.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_TARGET_WIDTH = 600;
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const LOGO_PATH = path.join(PACKAGE_ROOT, "public", "assets", "logo.png");
const OUT_PATH = path.join(PACKAGE_ROOT, "public", "assets", "og-image.jpg");

async function main(): Promise<void> {
  const logo = await sharp(LOGO_PATH)
    .resize({ width: LOGO_TARGET_WIDTH, withoutEnlargement: true })
    .toBuffer();

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .jpeg({ quality: 90, mozjpeg: true, progressive: true })
    .toFile(OUT_PATH);

  const { size } = await fs.stat(OUT_PATH);
  console.log(
    `[og] wrote ${path.relative(PACKAGE_ROOT, OUT_PATH)} — ${(size / 1024).toFixed(1)} KB`,
  );
}

void main();
