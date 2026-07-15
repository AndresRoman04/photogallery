import { describe, it, expect, afterEach, vi } from "vitest"

// The S3 client mock keeps the module import side-effect-free; getImageUrl
// itself never touches the client.
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}))
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}))

import { getImageUrl } from "./storage"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("getImageUrl", () => {
  it("joins endpoint, bucket, and storage path", () => {
    vi.stubEnv("STORAGE_ENDPOINT", "http://storage:9000")

    expect(getImageUrl("1781590380430-abc123.jpg")).toBe(
      "http://storage:9000/photos/1781590380430-abc123.jpg"
    )
  })

  it("reads the endpoint at call time, not import time", () => {
    vi.stubEnv("STORAGE_ENDPOINT", "http://localhost:9000")
    expect(getImageUrl("a.jpg")).toBe("http://localhost:9000/photos/a.jpg")

    // A changed endpoint (Docker vs local dev) must be picked up immediately —
    // this is the property BFT-12 relies on to keep URLs derivable, never stale.
    vi.stubEnv("STORAGE_ENDPOINT", "http://storage:9000")
    expect(getImageUrl("a.jpg")).toBe("http://storage:9000/photos/a.jpg")
  })

  it("throws a clear error when STORAGE_ENDPOINT is unset", () => {
    vi.stubEnv("STORAGE_ENDPOINT", "")

    expect(() => getImageUrl("a.jpg")).toThrow(
      "STORAGE_ENDPOINT environment variable is not set"
    )
  })

  it("uses a custom STORAGE_BUCKET when set at module load", async () => {
    // BUCKET_NAME is captured at module scope, so exercising a non-default
    // bucket needs a fresh module instance.
    vi.stubEnv("STORAGE_BUCKET", "customer-uploads")
    vi.stubEnv("STORAGE_ENDPOINT", "http://storage:9000")
    vi.resetModules()

    const { getImageUrl: freshGetImageUrl } = await import("./storage")
    expect(freshGetImageUrl("b.png")).toBe("http://storage:9000/customer-uploads/b.png")
  })

  it("falls back to the photos bucket when STORAGE_BUCKET is unset", async () => {
    vi.stubEnv("STORAGE_BUCKET", "")
    vi.stubEnv("STORAGE_ENDPOINT", "http://storage:9000")
    vi.resetModules()

    const { getImageUrl: freshGetImageUrl } = await import("./storage")
    expect(freshGetImageUrl("c.webp")).toBe("http://storage:9000/photos/c.webp")
  })
})
