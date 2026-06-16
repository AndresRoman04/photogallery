// Seeds the first admin account from ADMIN_EMAIL/ADMIN_PASSWORD so a fresh
// database always has at least one usable login. Safe to run repeatedly:
// it only creates a user when the table is empty, and never overwrites an
// existing account.
import "dotenv/config"
import { prisma } from "../lib/prisma"
import { hashPassword } from "../lib/password"

async function main() {
  const existingUserCount = await prisma.user.count()
  if (existingUserCount > 0) {
    console.log(`Skipping seed: ${existingUserCount} user(s) already exist.`)
    return
  }

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.log("Skipping seed: ADMIN_EMAIL/ADMIN_PASSWORD not set.")
    return
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.create({
    data: { email, passwordHash, name: "Admin" },
  })
  console.log(`Seeded initial admin user: ${email}`)
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
