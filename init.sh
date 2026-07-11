#!/bin/bash
set -e

echo "🚀 Initializing Photo Gallery Stack..."

# 1. Link environment file if present in parent env directory, otherwise generate
if [ ! -f .env ]; then
  if [ -f ../env/.env ]; then
    echo "🔗 Symlinking .env to ../env/.env..."
    ln -s ../env/.env .env
  else
    echo "📄 Creating .env file..."
    
    # Generate random secure secrets
    RANDOM_SECRET=$(openssl rand -base64 33 2>/dev/null || echo "placeholder_auth_secret_please_change_me_1234567890")
    POSTGRES_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "change_me_postgres_password")
    MINIO_ROOT_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "change_me_minio_password")

    cat <<EOT > .env
# Database (Postgres/Docker)
POSTGRES_USER="user"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
DATABASE_URL="postgresql://user:${POSTGRES_PASSWORD}@localhost:5432/photogallery"

# Authentication (Auth.js)
AUTH_SECRET="${RANDOM_SECRET}"
NEXTAUTH_URL="http://localhost:3000"
# Used only to seed the first DB-backed user account on first run (see prisma/seed.ts)
# and as a fallback notification recipient. Accounts are managed at /admin/users afterward.
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="adminPassword"

# Branding: shown in the home hero and footer. Baked into the client bundle at
# build time (NEXT_PUBLIC_*) — rebuild the app container after changing it.
# NEXT_PUBLIC_STUDIO_NAME="Photo Gallery"

# Optional: customer sign-in via Google/Facebook at /account. Omit to keep
# customers limited to email/password registration — no app credentials needed.
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# FACEBOOK_CLIENT_ID=""
# FACEBOOK_CLIENT_SECRET=""

# Storage (MinIO / S3)
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}"
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_ACCESS_KEY="admin"
STORAGE_SECRET_KEY="${MINIO_ROOT_PASSWORD}"
STORAGE_BUCKET="photos"
EOT
  fi
fi

# 2. Build and start containers
echo "📦 Starting Docker containers..."
docker compose up -d --build

# 3. Provision the storage bucket (idempotent: creates the photos bucket if
# missing and applies the anonymous-download policy photos need to display)
echo "🪣 Provisioning storage bucket..."
docker compose run --rm storage-init

# 4. Wait for database to be ready
echo "⏳ Waiting for PostgreSQL database to be ready..."
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-user}" -d photogallery >/dev/null 2>&1; do
  sleep 1
done

# 5. Push Prisma schema to the database (one-shot tooling container — the
# app image is a pure standalone build with no Prisma CLI in it)
echo "🔄 Syncing database schema with Prisma..."
docker compose run --rm migrate

# 6. Seed the initial admin user (only runs if the users table is empty)
echo "👤 Seeding initial admin user..."
docker compose run --rm migrate pnpm exec prisma db seed

echo "✅ Initialization complete!"
echo "🌐 App is running at: http://localhost:3000"
echo "🗄️ MinIO S3 API is at: http://localhost:9000"
echo "📊 MinIO Console is at: http://localhost:9001"
echo "🔐 Admin credentials: admin@example.com / adminPassword"
echo "   (Manage additional accounts at /admin/users once logged in.)"
