import { uuidv7 } from "uuidv7";

import { isBase64SizeValid } from "@/api/lib/images";
import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";

export class PlanImageError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const resolvePlanImageUrl = async (
  input: string | null | undefined,
  planId: string,
): Promise<string | null> => {
  if (!input) return null;
  if (input.startsWith("http")) return input;
  if (!isBase64SizeValid(input)) {
    throw new PlanImageError(400, "Image too large");
  }
  const key = `${process.env.APP_NAME}/plans/${planId}/${uuidv7()}.jpeg`;
  try {
    await putImageOnS3(key, Buffer.from(input, "base64"));
  } catch {
    throw new PlanImageError(500, "Image upload failed");
  }
  return getPublicUrl(key);
};
