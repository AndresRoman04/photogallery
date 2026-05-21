import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: "us-east-1", // MinIO/S3 requires a region, though MinIO ignores it
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
})

const BUCKET_NAME = process.env.STORAGE_BUCKET || "photos"

export async function uploadFile(fileName: string, file: Buffer | Blob, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return fileName
}

export async function getPublicUrl(fileName: string) {
  // Use a separate public endpoint if provided (e.g. localhost:9000 for browser)
  const publicEndpoint = process.env.NEXT_PUBLIC_STORAGE_ENDPOINT || process.env.STORAGE_ENDPOINT
  return `${publicEndpoint}/${BUCKET_NAME}/${fileName}`
}
