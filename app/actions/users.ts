"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export async function getUsersAction() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    return { success: true, users }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function createUserAction(data: { email: string; password: string; name?: string | null }) {
  try {
    const email = data.email?.trim().toLowerCase()
    const password = data.password ?? ""

    if (!email || !EMAIL_REGEX.test(email)) {
      return { success: false, error: "Enter a valid email address." }
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, passwordHash, name: data.name?.trim() || null },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    revalidatePath("/admin/users")
    return { success: true, user }
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "A user with that email already exists." }
    }
    console.error("Failed to create user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function updateUserAction(
  userId: string,
  data: { name?: string | null; password?: string }
) {
  try {
    const updateData: { name?: string | null; passwordHash?: string } = {}

    if (data.name !== undefined) {
      updateData.name = data.name?.trim() || null
    }
    if (data.password) {
      if (data.password.length < MIN_PASSWORD_LENGTH) {
        return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
      }
      updateData.passwordHash = await hashPassword(data.password)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, createdAt: true },
    })

    revalidatePath("/admin/users")
    return { success: true, user }
  } catch (error) {
    console.error("Failed to update user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const [session, target] = await Promise.all([
      auth(),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    ])
    if (!target) {
      return { success: false, error: "User not found" }
    }
    // session.user only carries the Auth.js-default fields (name/email/image),
    // so identity is compared by email rather than the DB id.
    if (session?.user?.email === target.email) {
      return { success: false, error: "You cannot delete your own account while logged in." }
    }

    const totalUsers = await prisma.user.count()
    if (totalUsers <= 1) {
      return { success: false, error: "Cannot delete the last remaining user account." }
    }

    await prisma.user.delete({ where: { id: userId } })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}
