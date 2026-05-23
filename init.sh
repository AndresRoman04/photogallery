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
    
    # Generate a random secure auth secret
    RANDOM_SECRET=$(openssl rand -base64 33 2>/dev/null || echo "placeholder_auth_secret_please_change_me_1234567890")
    
    cat <<EOT > .env
# Database (Postgres/Docker)
DATABASE_URL="postgresql://user:password@localhost:5432/photogallery"

# Authentication (Auth.js)
AUTH_SECRET="${RANDOM_SECRET}"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="adminPassword"

# Storage (MinIO / S3)
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_ACCESS_KEY="admin"
STORAGE_SECRET_KEY="password"
STORAGE_BUCKET="photos"
EOT
  fi
fi

# 2. Build and start containers
echo "📦 Starting Docker containers..."
docker compose up -d --build

# 3. Wait for database to be ready
echo "⏳ Waiting for PostgreSQL database to be ready..."
until docker compose exec -T db pg_isready -U user -d photogallery >/dev/null 2>&1; do
  sleep 1
done

# 4. Push Prisma schema to the database
echo "🔄 Syncing database schema with Prisma..."
docker compose exec -T app npx prisma db push

echo "✅ Initialization complete!"
echo "🌐 App is running at: http://localhost:3000"
echo "🗄️ MinIO S3 API is at: http://localhost:9000"
echo "📊 MinIO Console is at: http://localhost:9001"
echo "🔐 Admin credentials: admin@example.com / adminPassword"
