#!/bin/bash
set -ex

echo "=== Step 1: Install root workspace deps ==="
npm install

echo "=== Step 2: Force install prisma in root node_modules ==="
cd packages/backend
npm install prisma@5.22.0 @prisma/client@5.22.0 --no-save --legacy-peer-deps 2>/dev/null || npm install prisma@5.22.0 @prisma/client@5.22.0 --no-save

echo "=== Step 3: Check prisma binary ==="
ls -la ../../node_modules/.bin/prisma 2>/dev/null || echo "Not in root"
ls -la ./node_modules/.bin/prisma 2>/dev/null || echo "Not in backend"
ls -la ../node_modules/.bin/prisma 2>/dev/null || echo "Not in packages"

echo "=== Step 4: Find and run prisma ==="
PRISMA_BIN=""
if [ -f "./node_modules/.bin/prisma" ]; then
  PRISMA_BIN="./node_modules/.bin/prisma"
elif [ -f "../../node_modules/.bin/prisma" ]; then
  PRISMA_BIN="../../node_modules/.bin/prisma"
else
  echo "Prisma not found anywhere, installing globally..."
  npm install -g prisma@5.22.0 @prisma/client@5.22.0
  PRISMA_BIN="prisma"
fi

echo "=== Using prisma at: $PRISMA_BIN ==="
$PRISMA_BIN generate
$PRISMA_BIN migrate deploy

echo "=== Build complete ==="
