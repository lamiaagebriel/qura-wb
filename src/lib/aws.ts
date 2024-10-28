import AWS, { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

const s3Config = new AWS.S3Client({
	region: process.env.AWS_SPACE_REGION,
	credentials: {
		accessKeyId: process.env.AWS_SPACE_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SPACE_ACCESS_SECRET_KEY!,
	},
});

async function upload({ Key, ...props }: Omit<PutObjectCommandInput, "Bucket">) {
	// Set up S3 upload parameters
	const params: PutObjectCommandInput = {
		Bucket: process.env.AWS_SPACE_BUCKET!,
		Key: `${Key ?? ""}${Date.now()}`, // Unique key for the file
		ACL: "public-read", // Make the file publicly accessible,
		...props,
	};

	console.log(params);
	await s3Config.send(new PutObjectCommand(params));
	return `https://${params?.["Bucket"]}.s3.${process.env.AWS_SPACE_REGION}.amazonaws.com/${params?.["Key"]}`;
}

const aws = {
	s3Config,
	upload,
};

export { aws };
