// require() is deliberate: dotenv must stay an *optional* dependency here
// (environments like the Docker migrate service provide env vars directly),
// and a static ESM import can't be wrapped in a try/catch.
/* eslint-disable @typescript-eslint/no-require-imports */
try {
  const path = require("path");
  require("dotenv").config({ path: path.resolve(__dirname, "../env/.env") });
  require("dotenv").config(); // Fallback to local .env
} catch {
  // dotenv not found, assuming env vars are already provided by Docker/System
}
/* eslint-enable @typescript-eslint/no-require-imports */
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Dummy, non-connectable placeholder so `prisma generate` can validate config shape
    // without a real DATABASE_URL — never used to open an actual connection.
    url: process.env.DATABASE_URL || "postgresql://invalid:invalid@invalid-host:5432/invalid",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
