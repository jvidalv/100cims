import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const getS3Client = () =>
  new S3Client({
    region: process.env.AWS_BUCKET_REGION!,
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY!,
    },
  });

export const putImageOnS3 = async (
  key: string,
  content: Buffer<ArrayBuffer>,
) => {
  const client = getS3Client();
  return client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
      Key: key,
      Body: content,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    }),
  );
};

export const getPublicUrl = (key: string) =>
  `https://${process.env.AWS_PUBLIC_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}?date=${Date.now()}`;
