import { uuidv7 } from "uuidv7";

import { isBase64SizeValid } from "@/api/lib/images";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";

/**
 * Image upload helper for mountain comments — mirrors plan-images.ts.
 * Returns `{ url }` so the caller can store the JSONB element as-is; the
 * shape leaves room for future per-image metadata (caption, description).
 */
export class CommentImageError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const resolveCommentImage = async (
  base64OrUrl: string,
  commentId: string,
): Promise<{ url: string }> => {
  if (base64OrUrl.startsWith("http")) return { url: base64OrUrl };
  if (!isBase64SizeValid(base64OrUrl)) {
    throw new CommentImageError(400, "Image too large");
  }
  const key = `${process.env.APP_NAME}/mountain-comments/${commentId}/${uuidv7()}.jpeg`;
  try {
    await putImageOnS3(key, Buffer.from(base64OrUrl, "base64"));
  } catch {
    throw new CommentImageError(500, "Image upload failed");
  }
  return { url: getPublicUrl(key) };
};
