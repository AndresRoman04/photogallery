import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    photo: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), delete: vi.fn() },
    customerSelection: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
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
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"
import { auth } from "@/lib/auth"
import {
  uploadPhotoAction,
  getGalleryPhotosAction,
  getPhotographersAction,
  getMyPhotosAction,
  getSelectionsAction,
  submitSelectionAction,
  deletePhotoAction,
} from "./photos"

const ADMIN_SESSION = { user: { id: "admin-1", role: "admin" } }

beforeEach(() => {
  vi.clearAllMocks()
  // Owner-scoped actions require an admin session; individual tests override
  // this to exercise the unauthorized paths.
  vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as any)
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

  it("stamps the new photo with the session user's id", async () => {
    vi.mocked(prisma.photo.create).mockResolvedValue({ id: "1", title: "test" } as any)
    const formData = new FormData()
    formData.append("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }))
    formData.append("title", "test")
    await uploadPhotoAction(formData)
    expect(prisma.photo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "admin-1" }),
    })
  })

  it("rejects a caller without an admin session", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "cust-1", role: "customer" } } as any)
    const formData = new FormData()
    formData.append("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }))
    formData.append("title", "test")
    const result = await uploadPhotoAction(formData)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Not authorized/)
    expect(prisma.photo.create).not.toHaveBeenCalled()
  })
})

describe("getGalleryPhotosAction", () => {
  it("returns only the slug owner's active photos", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)
    vi.mocked(prisma.photo.findMany).mockResolvedValue([{ id: "1" }] as any)
    vi.mocked(prisma.photo.count).mockResolvedValue(1)
    const result = await getGalleryPhotosAction("jane-doe")
    expect(result).toMatchObject({ success: true, total: 1 })
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { slug: "jane-doe" },
      select: { id: true },
    })
    expect(prisma.photo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", isActive: true } })
    )
  })

  it("returns a failure result for an unknown slug", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const result = await getGalleryPhotosAction("nobody")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not found/i)
    expect(prisma.photo.findMany).not.toHaveBeenCalled()
  })

  it("returns a failure result if the query throws", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)
    vi.mocked(prisma.photo.findMany).mockRejectedValue(new Error("db down"))
    const result = await getGalleryPhotosAction("jane-doe")
    expect(result.success).toBe(false)
  })
})

describe("getPhotographersAction", () => {
  it("maps photographers with cover image and photo count", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        name: "Jane",
        slug: "jane",
        photos: [{ imageUrl: "http://x/cover.jpg" }],
        _count: { photos: 4 },
      },
      { name: null, slug: "bob", photos: [], _count: { photos: 1 } },
    ] as any)
    const result = await getPhotographersAction()
    expect(result.success).toBe(true)
    expect(result.photographers).toEqual([
      { name: "Jane", slug: "jane", photoCount: 4, coverImageUrl: "http://x/cover.jpg" },
      { name: null, slug: "bob", photoCount: 1, coverImageUrl: null },
    ])
  })

  it("returns a failure result if the query throws", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("db down"))
    const result = await getPhotographersAction()
    expect(result.success).toBe(false)
  })
})

describe("getMyPhotosAction", () => {
  it("only queries photos owned by the session user", async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([{ id: "1" }] as any)
    vi.mocked(prisma.photo.count).mockResolvedValue(1)
    const result = await getMyPhotosAction()
    expect(result).toMatchObject({ success: true, total: 1 })
    expect(prisma.photo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "admin-1" } })
    )
    expect(prisma.photo.count).toHaveBeenCalledWith({ where: { userId: "admin-1" } })
  })

  it("rejects a caller without an admin session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await getMyPhotosAction()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Not authorized/)
    expect(prisma.photo.findMany).not.toHaveBeenCalled()
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

  it("scopes selections to the logged-in photographer's photos", async () => {
    vi.mocked(prisma.customerSelection.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.customerSelection.count).mockResolvedValue(0)
    await getSelectionsAction()
    const ownershipWhere = { photos: { some: { photo: { userId: "admin-1" } } } }
    expect(prisma.customerSelection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: ownershipWhere })
    )
    expect(prisma.customerSelection.count).toHaveBeenCalledWith({ where: ownershipWhere })
  })

  it("rejects a caller without an admin session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await getSelectionsAction()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Not authorized/)
    expect(prisma.customerSelection.findMany).not.toHaveBeenCalled()
  })

  it("returns a failure result if the query throws", async () => {
    vi.mocked(prisma.customerSelection.findMany).mockRejectedValue(new Error("db down"))
    const result = await getSelectionsAction()
    expect(result.success).toBe(false)
  })
})

describe("submitSelectionAction", () => {
  // What the pre-create validation query returns: real, active, single-owner.
  const validPhotos = [
    { id: "p1", isActive: true, userId: "u1" },
    { id: "p2", isActive: true, userId: "u1" },
  ]

  it("creates a selection via the relation", async () => {
    vi.mocked(prisma.customerSelection.create).mockResolvedValue({ id: "s1" } as any)
    vi.mocked(prisma.photo.findMany).mockResolvedValue(validPhotos as any)

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

  it("rejects an empty selection", async () => {
    const result = await submitSelectionAction({ customerEmail: "a@b.com", selectedPhotos: [] })
    expect(result.success).toBe(false)
    expect(prisma.customerSelection.create).not.toHaveBeenCalled()
  })

  it("rejects photos from two different photographers", async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([
      { id: "p1", isActive: true, userId: "u1" },
      { id: "p2", isActive: true, userId: "u2" },
    ] as any)

    const result = await submitSelectionAction({ customerEmail: "a@b.com", selectedPhotos: ["p1", "p2"] })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/same photographer/)
    expect(prisma.customerSelection.create).not.toHaveBeenCalled()
  })

  it("rejects ids that don't resolve to existing photos", async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([validPhotos[0]] as any)
    const result = await submitSelectionAction({ customerEmail: "a@b.com", selectedPhotos: ["p1", "ghost"] })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/unavailable/)
    expect(prisma.customerSelection.create).not.toHaveBeenCalled()
  })

  it("rejects inactive photos", async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([
      { id: "p1", isActive: false, userId: "u1" },
    ] as any)
    const result = await submitSelectionAction({ customerEmail: "a@b.com", selectedPhotos: ["p1"] })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/unavailable/)
    expect(prisma.customerSelection.create).not.toHaveBeenCalled()
  })

  it("still succeeds if the notification email fails", async () => {
    vi.mocked(prisma.customerSelection.create).mockResolvedValue({ id: "s1" } as any)
    // First findMany validates the selection; second one (email body lookup) fails.
    vi.mocked(prisma.photo.findMany)
      .mockResolvedValueOnce([validPhotos[0]] as any)
      .mockRejectedValueOnce(new Error("email lookup failed"))

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

  it("scopes the delete to photos owned by the session user", async () => {
    vi.mocked(prisma.photo.delete).mockResolvedValue({ id: "1", storagePath: "x.jpg" } as any)
    await deletePhotoAction("1")
    expect(prisma.photo.delete).toHaveBeenCalledWith({
      where: { id: "1", userId: "admin-1" },
    })
  })

  it("rejects deleting another user's photo as not found", async () => {
    // Prisma throws P2025 when the ownership-scoped where matches nothing —
    // same result whether the photo belongs to someone else or doesn't exist.
    vi.mocked(prisma.photo.delete).mockRejectedValue({ code: "P2025" })
    const result = await deletePhotoAction("someone-elses-photo")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not found/i)
    expect(deleteFile).not.toHaveBeenCalled()
  })

  it("rejects a caller without an admin session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await deletePhotoAction("1")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Not authorized/)
    expect(prisma.photo.delete).not.toHaveBeenCalled()
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
