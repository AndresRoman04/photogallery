import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    photo: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), delete: vi.fn() },
    customerSelection: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  },
}))
vi.mock("@/lib/storage", () => ({
  uploadFile: vi.fn(),
  getPublicUrl: vi.fn().mockResolvedValue("http://localhost:9000/photos/test.jpg"),
  deleteFile: vi.fn(),
}))
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: vi.fn() } })),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"
import {
  uploadPhotoAction,
  getPhotosAction,
  getSelectionsAction,
  submitSelectionAction,
  deletePhotoAction,
} from "./photos"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("uploadPhotoAction", () => {
  it("rejects an unsupported file extension", async () => {
    const formData = new FormData()
    formData.append("file", new File(["x"], "malware.exe", { type: "application/octet-stream" }))
    formData.append("title", "test")
    const result = await uploadPhotoAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unsupported file extension/)
  })

  it("rejects a content type that doesn't match the extension", async () => {
    const formData = new FormData()
    formData.append("file", new File(["x"], "photo.jpg", { type: "image/png" }))
    formData.append("title", "test")
    const result = await uploadPhotoAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/does not match/)
  })

  it("rejects a file over the size limit", async () => {
    const big = new File([new Uint8Array(9 * 1024 * 1024)], "photo.jpg", { type: "image/jpeg" })
    const formData = new FormData()
    formData.append("file", big)
    formData.append("title", "test")
    const result = await uploadPhotoAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/too large/i)
  })

  it("creates a photo on valid input", async () => {
    vi.mocked(prisma.photo.create).mockResolvedValue({ id: "1", title: "test" } as any)
    const formData = new FormData()
    formData.append("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }))
    formData.append("title", "test")
    const result = await uploadPhotoAction(formData)
    expect(result.success).toBe(true)
  })
})

describe("getPhotosAction", () => {
  it("returns photos and total on success", async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([{ id: "1" }] as any)
    vi.mocked(prisma.photo.count).mockResolvedValue(1)
    const result = await getPhotosAction()
    expect(result).toMatchObject({ success: true, total: 1 })
  })

  it("returns a failure result if the query throws", async () => {
    vi.mocked(prisma.photo.findMany).mockRejectedValue(new Error("db down"))
    const result = await getPhotosAction()
    expect(result.success).toBe(false)
  })
})

describe("getSelectionsAction", () => {
  it("resolves nested photos through the relation", async () => {
    vi.mocked(prisma.customerSelection.findMany).mockResolvedValue([
      {
        id: "s1",
        customerEmail: "a@b.com",
        customerName: "A",
        notes: null,
        createdAt: new Date(),
        photos: [{ photo: { id: "p1", title: "Paris" } }],
      },
    ] as any)
    vi.mocked(prisma.customerSelection.count).mockResolvedValue(1)

    const result = await getSelectionsAction()
    expect(result.success).toBe(true)
    expect(result.selections?.[0].photos).toEqual([{ id: "p1", title: "Paris" }])
  })

  it("returns a failure result if the query throws", async () => {
    vi.mocked(prisma.customerSelection.findMany).mockRejectedValue(new Error("db down"))
    const result = await getSelectionsAction()
    expect(result.success).toBe(false)
  })
})

describe("submitSelectionAction", () => {
  it("creates a selection via the relation", async () => {
    vi.mocked(prisma.customerSelection.create).mockResolvedValue({ id: "s1" } as any)
    vi.mocked(prisma.photo.findMany).mockResolvedValue([])

    const result = await submitSelectionAction({
      customerEmail: "a@b.com",
      selectedPhotos: ["p1", "p2"],
    })

    expect(result.success).toBe(true)
    expect(prisma.customerSelection.create).toHaveBeenCalledWith({
      data: {
        customerEmail: "a@b.com",
        customerName: undefined,
        notes: undefined,
        photos: { create: [{ photoId: "p1" }, { photoId: "p2" }] },
      },
    })
  })

  it("still succeeds if the notification email fails", async () => {
    vi.mocked(prisma.customerSelection.create).mockResolvedValue({ id: "s1" } as any)
    vi.mocked(prisma.photo.findMany).mockRejectedValue(new Error("email lookup failed"))

    const result = await submitSelectionAction({ customerEmail: "a@b.com", selectedPhotos: ["p1"] })
    expect(result.success).toBe(true)
  })
})

describe("deletePhotoAction", () => {
  it("deletes the photo and its storage object", async () => {
    vi.mocked(prisma.photo.delete).mockResolvedValue({ id: "1", storagePath: "x.jpg" } as any)
    const result = await deletePhotoAction("1")
    expect(result.success).toBe(true)
    expect(deleteFile).toHaveBeenCalledWith("x.jpg")
  })

  it("still succeeds if storage cleanup fails", async () => {
    vi.mocked(prisma.photo.delete).mockResolvedValue({ id: "1", storagePath: "x.jpg" } as any)
    vi.mocked(deleteFile).mockRejectedValue(new Error("storage down"))
    const result = await deletePhotoAction("1")
    expect(result.success).toBe(true)
  })

  it("returns a failure result if the DB delete throws", async () => {
    vi.mocked(prisma.photo.delete).mockRejectedValue(new Error("not found"))
    const result = await deletePhotoAction("missing")
    expect(result.success).toBe(false)
  })
})
