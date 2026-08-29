#!/bin/bash
set -ex

echo "=== Step 1: Install workspace deps ==="
npm install

echo "=== Step 2: Ensure prisma is installed ==="
npm install prisma@5.22.0 @prisma/client@5.22.0

echo "=== Step 3: Find prisma binary ==="
PRISMA_BIN=""
if [ -f "./node_modules/.bin/prisma" ]; then
  PRISMA_BIN="./node_modules/.bin/prisma"
elif [ -f "./node_modules/prisma/build/index.js" ]; then
  PRISMA_BIN="node ./node_modules/prisma/build/index.js"
elif [ -f "./packages/backend/node_modules/.bin/prisma" ]; then
  PRISMA_BIN="./packages/backend/node_modules/.bin/prisma"
elif [ -f "./packages/backend/node_modules/prisma/build/index.js" ]; then
  PRISMA_BIN="node ./packages/backend/node_modules/prisma/build/index.js"
else
  echo "Prisma binary not found. Listing node_modules..."
  find . -name "prisma" -type d -maxdepth 5 2>/dev/null | head -20
  find . -path "*/bin/prisma" -maxdepth 5 2>/dev/null | head -10
  echo "Trying npx with explicit version..."
  PRISMA_BIN="npx prisma@5.22.0"
fi

echo "=== Using: $PRISMA_BIN ==="
$PRISMA_BIN generate --schema=packages/backend/prisma/schema.prisma
$PRISMA_BIN migrate deploy --schema=packages/backend/prisma/schema.prisma

echo "=== Build complete ==="
