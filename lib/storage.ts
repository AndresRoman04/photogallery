import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

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

// Builds the image URL from the internal storage endpoint (e.g. http://storage:9000
// in Docker). Called at read time rather than persisted, so a changed endpoint
// (DHCP IP, docker network) never invalidates already-uploaded photos. The Next.js
// image optimizer fetches this server-side and serves the result to the browser,
// so the browser itself never needs a direct route to MinIO.
export function getImageUrl(storagePath: string) {
  return `${process.env.STORAGE_ENDPOINT}/${BUCKET_NAME}/${storagePath}`
}

export async function deleteFile(fileName: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  })

  await s3Client.send(command)
}
