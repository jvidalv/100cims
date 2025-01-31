export const isBase64SizeValid = (
  base64Data: string,
  maxSizeInKB: number,
): boolean => {
  const sizeInBytes = Buffer.byteLength(base64Data, "base64");
  const sizeInKB = sizeInBytes / 1024;

  return sizeInKB <= maxSizeInKB;
};
