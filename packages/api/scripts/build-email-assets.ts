/**
 * Pre-renders email image assets that need to be served as flat (non-transparent)
 * images, since transparency in email clients is unreliable.
 *
 * Source: packages/api/public/assets/logo-white.png (white logo on transparent)
 * Output: packages/api/public/emails/logo-on-black.png (white logo on solid black)
 *
 * Run with: yarn tsx packages/api/scripts/build-email-assets.ts
 * Re-run whenever the source logo changes; commit the output.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const SRC = join(REPO_ROOT, "public/assets/logo-white.png");
const OUT_DIR = join(REPO_ROOT, "public/emails");
const OUT = join(OUT_DIR, "logo-on-black.png");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const info = await sharp(SRC)
    .flatten({ background: "#000000" })
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  console.log(
    `Wrote ${OUT} (${info.width}x${info.height}, ${info.size} bytes)`,
  );
}

void main();
