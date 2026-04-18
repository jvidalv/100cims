import { uuidv7 } from "uuidv7";

import { getPublicUrl, putImageOnS3 } from "@/api/routes/@shared/s3";
import { isBase64SizeValid } from "@/api/lib/images";

const MAX_IMAGES = 4;

export class MerchImageError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const resolveMerchImageUrls = async (
  inputs: string[],
  merchId: string,
  variantColor?: string,
): Promise<string[]> => {
  if (inputs.length > MAX_IMAGES) {
    throw new MerchImageError(400, `Too many images (max ${MAX_IMAGES})`);
  }
  const prefix = variantColor
    ? `${process.env.APP_NAME}/merch/${merchId}/${variantColor}`
    : `${process.env.APP_NAME}/merch/${merchId}`;
  return Promise.all(
    inputs.map(async (value) => {
      if (value.startsWith("http")) return value;
      if (!isBase64SizeValid(value)) {
        throw new MerchImageError(400, "Image too large");
      }
      const key = `${prefix}/${uuidv7()}.jpeg`;
      try {
        await putImageOnS3(key, Buffer.from(value, "base64"));
      } catch {
        throw new MerchImageError(500, "Image upload failed");
      }
      return getPublicUrl(key);
    }),
  );
};
