import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

import { base64ToBuffer, getMimeType } from "./utils";

const s3Config = new S3Client({
  region: process.env.AWS_SPACE_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SPACE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SPACE_ACCESS_SECRET_KEY!,
  },
});

export type AwsUploadProps = {} & Omit<PutObjectCommandInput, "Bucket">;
async function upload({ Key, ...props }: AwsUploadProps) {
  // Set up S3 upload parameters
  const params: PutObjectCommandInput = {
    Bucket: process.env.AWS_SPACE_BUCKET!,
    Key: `${Key ?? ""}${Date.now()}`, // Unique key for the file
    ACL: "public-read", // Make the file publicly accessible,
    ...props,
  };

  console.log(params);
  await s3Config.send(new PutObjectCommand(params));
  return `https://${params?.Bucket}.s3.${process.env.AWS_SPACE_REGION}.amazonaws.com/${params?.Key}`;
}

async function uploadImages(images: string[], props: AwsUploadProps) {
  const imagesWithType = images?.map((img, index) => ({
    image: img,
    type: img.includes("base64,") ? "base64" : "url",
    index, // store the original position
  }));

  // Process base64 images
  const processedImages = await Promise.all(
    imagesWithType.map(async ({ image, type, index }) => {
      if (type === "base64") {
        const uploadedImage = await aws.upload({
          Body: base64ToBuffer(image),
          ContentType: getMimeType(image),
          ...props,
        });
        return { image: uploadedImage, index };
      }

      return { image, index }; // keep URL images as they are
    })
  );

  // Reorder based on the original index
  return processedImages
    .sort((a, b) => a.index - b.index) // sort by the original position
    .map(({ image }) => image); // get only the image URLs
}

const aws = {
  s3Config,
  upload,
  uploadImages,
};

export { aws };
