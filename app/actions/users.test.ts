import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  },
}))
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}))
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { auth } from "@/lib/auth"
import { getUsersAction, createUserAction, updateUserAction, deleteUserAction } from "./users"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getUsersAction", () => {
  it("returns the user list on success", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: "1", email: "a@b.com", name: "A" }] as any)
    const result = await getUsersAction()
    expect(result).toMatchObject({ success: true })
    expect(result.users).toHaveLength(1)
  })

  it("returns a failure result if the query throws", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("db down"))
    const result = await getUsersAction()
    expect(result.success).toBe(false)
  })
})

describe("createUserAction", () => {
  it("rejects an invalid email", async () => {
    const result = await createUserAction({ email: "not-an-email", password: "longenough" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/valid email/)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("rejects a password under the minimum length", async () => {
    const result = await createUserAction({ email: "a@b.com", password: "short" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/at least/)
  })

  it("hashes the password and creates the user on valid input", async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "1", email: "a@b.com", name: null } as any)
    const result = await createUserAction({ email: "A@B.com", password: "longenough", name: "  Alice  " })
    expect(hashPassword).toHaveBeenCalledWith("longenough")
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: "a@b.com", passwordHash: "hashed-password", name: "Alice" },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    expect(result.success).toBe(true)
  })

  it("returns a friendly error on duplicate email", async () => {
    vi.mocked(prisma.user.create).mockRejectedValue({ code: "P2002" })
    const result = await createUserAction({ email: "a@b.com", password: "longenough" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/already exists/)
  })
})

describe("updateUserAction", () => {
  it("updates the name without touching the password", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: "1", email: "a@b.com", name: "New" } as any)
    const result = await updateUserAction("1", { name: "New" })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { name: "New" },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    expect(result.success).toBe(true)
  })

  it("rejects a new password under the minimum length", async () => {
    const result = await updateUserAction("1", { password: "short" })
    expect(result.success).toBe(false)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("hashes a new password when provided", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: "1" } as any)
    await updateUserAction("1", { password: "longenough" })
    expect(hashPassword).toHaveBeenCalledWith("longenough")
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { passwordHash: "hashed-password" },
      select: { id: true, email: true, name: true, createdAt: true },
    })
  })
})

describe("deleteUserAction", () => {
  it("refuses to delete the currently logged-in user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)
    const result = await deleteUserAction("u1")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/own account/)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it("refuses to delete the last remaining user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u2" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)
    vi.mocked(prisma.user.count).mockResolvedValue(1)
    const result = await deleteUserAction("u1")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/last remaining/)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it("deletes the user when checks pass", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u2" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)
    vi.mocked(prisma.user.count).mockResolvedValue(2)
    vi.mocked(prisma.user.delete).mockResolvedValue({ id: "u1" } as any)
    const result = await deleteUserAction("u1")
    expect(result.success).toBe(true)
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } })
  })

  it("returns a failure result when the target user doesn't exist", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u2" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const result = await deleteUserAction("missing")
    expect(result.success).toBe(false)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it("returns a friendly error when the user still owns photos", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u2" } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any)
    vi.mocked(prisma.user.count).mockResolvedValue(2)
    vi.mocked(prisma.user.delete).mockRejectedValue({ code: "P2003" })
    const result = await deleteUserAction("u1")
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/still owns photos/)
  })
})
