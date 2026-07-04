#!/bin/sh
set -eu

echo "Waiting for database schema sync..."
until npx prisma db push --skip-generate >/tmp/prisma-db-push.log 2>&1; do
  cat /tmp/prisma-db-push.log
  echo "Database not ready yet. Retrying in 2 seconds..."
  sleep 2
done

echo "Seeding baseline data..."
npx prisma db seed

echo "Starting Next.js server..."
exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
