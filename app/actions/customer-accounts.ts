"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export async function registerCustomerAction(data: { email: string; password: string; name?: string | null }) {
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
    await prisma.customerAccount.create({
      data: { email, passwordHash, name: data.name?.trim() || null, provider: "credentials" },
    })

    return { success: true, email }
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, error: "An account with that email already exists." }
    }
    console.error("Failed to register customer account:", error)
    return { success: false, error: "Failed to register" }
  }
}
