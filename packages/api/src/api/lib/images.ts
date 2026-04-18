export const MAX_IMAGE_KB = 3072;

export const isBase64SizeValid = (
  base64Data: string,
  maxSizeInKB: number = MAX_IMAGE_KB,
): boolean => {
  const sizeInBytes = Buffer.byteLength(base64Data, "base64");
  const sizeInKB = sizeInBytes / 1024;

  return sizeInKB <= maxSizeInKB;
};
