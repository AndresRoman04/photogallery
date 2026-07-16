import path from "path"
import dotenv from "dotenv"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../env/.env") })
dotenv.config() // Fallback to local .env

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Without this, Next dev blocks cross-origin requests for its own JS
  // chunks/HMR assets when the page is loaded via a non-localhost origin
  // (e.g. testing from another device on the LAN at http://192.168.1.x:3000).
  // That silently breaks client-side hydration, which is why client components
  // like PhotoGallery never get past their "loading" state in that scenario.
  // Wildcard covers the whole /24 so this keeps working if DHCP reassigns the IP.
  allowedDevOrigins: ["192.168.1.*"],
  experimental: {
    serverActions: {
      // Must stay above MAX_FILE_SIZE_MB in app/actions/photos.ts (20MB) plus
      // multipart encoding overhead — Next rejects the request before the
      // action's own size check runs otherwise.
      bodySizeLimit: "24mb",
    },
  },
  images: {
    // Optimizer runs server-side, so it needs the Docker-internal storage
    // alias (browsers never fetch MinIO directly anymore) plus localhost for
    // `npm run dev` outside Docker, where STORAGE_ENDPOINT is localhost:9000.
    // Both resolve to a private/loopback IP, which Next's image optimizer
    // blocks by default as SSRF protection (`remotePatterns` alone isn't
    // enough) — safe to override here since MinIO is our own storage, scoped
    // to the /photos/** patterns below.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "storage",
        port: "9000",
        pathname: "/photos/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/photos/**",
      },
    ],
  },
}

export default nextConfig
