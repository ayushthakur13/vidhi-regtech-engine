#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — go fill in GROQ_API_KEY before continuing."
  exit 1
fi

echo "Starting Postgres + Redis..."
docker compose up -d

echo "Waiting for Postgres to be ready..."
until docker compose exec -T postgres pg_isready -U vidhi > /dev/null 2>&1; do
  sleep 1
done

echo "Applying schema..."
source .env
psql "$DATABASE_URL" -f db/schema.sql

echo "Done. Next: cd apps/web && npm install && npm run dev"
