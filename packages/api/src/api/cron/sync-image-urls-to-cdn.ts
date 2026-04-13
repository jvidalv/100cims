import { sql } from "drizzle-orm";

import { db } from "@/db";

const TABLES: { name: string; column: string }[] = [
  { name: "challenge", column: "image_url" },
  { name: "mountain", column: "image_url" },
  { name: "user", column: "image_url" },
  { name: "summit", column: "image_url" },
  { name: "plan", column: "image_url" },
];

export async function syncImageUrlsToCdn(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[sync-image-urls-to-cdn] skipped (non-production)");
    return;
  }

  const cdn = process.env.AWS_PUBLIC_CDN_URL?.replace(/\/$/, "");
  const bucket = process.env.AWS_PUBLIC_BUCKET_NAME;
  const region = process.env.AWS_BUCKET_REGION;

  if (!cdn || !bucket || !region) {
    console.warn("[sync-image-urls-to-cdn] missing env, skipping");
    return;
  }

  const s3Host = `https://${bucket}.s3.${region}.amazonaws.com`;
  const counts = await Promise.all(
    TABLES.map(async ({ name, column }) => {
      const result = await db.execute(
        sql`UPDATE ${sql.identifier(name)}
            SET ${sql.identifier(column)} = REPLACE(${sql.identifier(column)}, ${s3Host}, ${cdn})
            WHERE ${sql.identifier(column)} LIKE ${s3Host + "%"}`,
      );
      return (result as unknown as { count?: number }).count ?? 0;
    }),
  );
  const total = counts.reduce((a, b) => a + b, 0);
  console.log(`[sync-image-urls-to-cdn] ${total} rows rewritten to CDN`);
}
