#!/bin/bash
set -e

echo "=== Installing root dependencies ==="
npm install

echo "=== Installing backend dependencies ==="
cd packages/backend
npm install

echo "=== Generating Prisma client ==="
# Find prisma binary - check local first, then root
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma generate
elif [ -f "../../node_modules/.bin/prisma" ]; then
  ../../node_modules/.bin/prisma generate
else
  echo "Prisma binary not found, installing locally..."
  npm install prisma@5.22.0 --no-save
  ./node_modules/.bin/prisma generate
fi

echo "=== Running database migrations ==="
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy
elif [ -f "../../node_modules/.bin/prisma" ]; then
  ../../node_modules/.bin/prisma migrate deploy
fi

echo "=== Build complete ==="
