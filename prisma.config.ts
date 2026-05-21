try {
  require("dotenv/config")
} catch (e) {
  // dotenv not found, assuming env vars are already provided by Docker/System
}
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use a dummy fallback for build-time validation (e.g. during npx prisma generate)
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/photogallery",
  },
})
