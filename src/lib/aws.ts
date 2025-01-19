import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
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

const AWS_SPACE_BASE_URL = `https://${process.env.AWS_SPACE_BUCKET!}.s3.${process.env.AWS_SPACE_REGION}.amazonaws.com/`;

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
  return `${AWS_SPACE_BASE_URL}${params?.Key}`;
}

async function uploadMany(objs: string[], props: AwsUploadProps) {
  const imagesWithType = objs?.map((img, index) => ({
    image: img,
    type: img.includes("base64,") ? "base64" : "url",
    index, // store the original position
  }));

  // Process base64 images
  const processedImages = await Promise.all(
    imagesWithType.map(async ({ image, type, index }) => {
      if (type === "base64") {
        const uploadedImage = await upload({
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

async function uploadOne(obj: string, props: AwsUploadProps) {
  return (await uploadMany([obj], props))?.pop() ?? null;
}

// New function to delete a single object
async function deleteOne(url: string) {
  const Key = url?.split(AWS_SPACE_BASE_URL)?.pop();
  if (!Key) return false;

  const params = {
    Bucket: process.env.AWS_SPACE_BUCKET!,
    Key,
  };

  try {
    await s3Config.send(new DeleteObjectCommand(params));
    return true;
  } catch (error) {
    console.error("Error deleting object:", error);
    throw error;
  }
}

// New function to delete multiple objects
async function deleteMany(url: string[]) {
  const Keys = url
    ?.map((e) => e?.split(AWS_SPACE_BASE_URL)?.pop())
    ?.filter((e) => !!e);
  if (!Keys?.length) return false;

  const params = {
    Bucket: process.env.AWS_SPACE_BUCKET!,
    Delete: {
      Objects: Keys.map((Key) => ({ Key })),
      Quiet: false,
    },
  };

  try {
    await s3Config.send(new DeleteObjectsCommand(params));
    return true;
  } catch (error) {
    console.error("Error deleting objects:", error);
    throw error;
  }
}

const aws = {
  s3Config,
  upload: uploadOne,
  uploadMany,
  delete: deleteOne,
  deleteMany,
};

export { aws };
