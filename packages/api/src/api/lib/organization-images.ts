import { uuidv7 } from "uuidv7";

import { isBase64SizeValid } from "@/api/lib/images";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";

export class OrganizationImageError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Accepts the same shapes as the other image-resolver helpers (plan, merch):
 *   - `null` / `undefined` / `""` → returns `null` (caller may treat as "clear").
 *   - A string starting with `http` → kept as-is (already an external/CDN URL).
 *   - A raw base64 payload → validated, uploaded to S3 under
 *     `<APP_NAME>/organizations/<orgId>/<uuid>.jpeg`, and the public URL is
 *     returned.
 *
 * The org id is part of the key so deleting or auditing per-org assets is
 * straightforward later. Each upload gets a fresh `uuidv7` so re-uploads
 * don't overwrite the previous file — old objects stay on S3 until you
 * decide to GC, matching how plans handle it.
 */
export const resolveOrganizationImageUrl = async (
  input: string | null | undefined,
  organizationId: string,
): Promise<string | null> => {
  if (!input) return null;
  if (input.startsWith("http")) return input;
  if (!isBase64SizeValid(input)) {
    throw new OrganizationImageError(400, "Image too large");
  }
  const key = `${process.env.APP_NAME}/organizations/${organizationId}/${uuidv7()}.jpeg`;
  try {
    await putImageOnS3(key, Buffer.from(input, "base64"));
  } catch {
    throw new OrganizationImageError(500, "Image upload failed");
  }
  return getPublicUrl(key);
};

export const MAX_ORGANIZATION_PHOTOS = 10;

/**
 * Resolve the org's showcase-gallery `photoUrls` array (0–10 photos). Each
 * element is either an existing `http(s)` URL (kept as-is, supports admin
 * re-ordering without re-upload) or a base64 payload (uploaded to S3 under
 * `<APP_NAME>/organizations/<orgId>/photos/<uuid>.jpeg`). Mirrors
 * `resolveMerchImageUrls` so the size validation and per-org keying stay
 * consistent across the codebase.
 */
export const resolveOrganizationPhotoUrls = async (
  inputs: string[],
  organizationId: string,
): Promise<string[]> => {
  if (inputs.length > MAX_ORGANIZATION_PHOTOS) {
    throw new OrganizationImageError(
      400,
      `Too many photos (max ${MAX_ORGANIZATION_PHOTOS})`,
    );
  }
  const prefix = `${process.env.APP_NAME}/organizations/${organizationId}/photos`;
  return Promise.all(
    inputs.map(async (value) => {
      if (value.startsWith("http")) return value;
      if (!isBase64SizeValid(value)) {
        throw new OrganizationImageError(400, "Image too large");
      }
      const key = `${prefix}/${uuidv7()}.jpeg`;
      try {
        await putImageOnS3(key, Buffer.from(value, "base64"));
      } catch {
        throw new OrganizationImageError(500, "Image upload failed");
      }
      return getPublicUrl(key);
    }),
  );
};
