import AWS from "aws-sdk";
import { PutObjectRequest } from "aws-sdk/clients/s3";

const s3Config = new AWS.S3({
	region: process.env.AWS_SPACE_REGION,
	credentials: {
		accessKeyId: process.env.AWS_SPACE_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SPACE_ACCESS_SECRET_KEY!,
	},
	httpOptions: { timeout: 60000 },
	s3ForcePathStyle: true,
	sslEnabled: true,
});

async function upload({ Key, ...props }: Omit<PutObjectRequest, "Bucket">) {
	// Set up S3 upload parameters
	const params: PutObjectRequest = {
		Bucket: process.env.AWS_SPACE_BUCKET!,
		Key: `${Key ?? ""}${Date.now()}`, // Unique key for the file
		ACL: "public-read", // Make the file publicly accessible,
		...props,
	};

	console.log(params);
	const result = await s3Config.upload(params).promise();
	return result?.["Location"];
}

const aws = {
	s3Config,
	upload,
};
export { aws };
