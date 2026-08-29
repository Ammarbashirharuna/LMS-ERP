#!/bin/bash
set -ex

echo "=== Step 1: Install workspace deps ==="
npm install

echo "=== Step 2: Force install prisma ==="
npm install prisma@5.22.0 @prisma/client@5.22.0 --save-dev

echo "=== Step 3: Verify prisma exists ==="
ls -la ./node_modules/prisma/build/index.js || { echo "FATAL: prisma not installed"; exit 1; }

echo "=== Running prisma generate ==="
node ./node_modules/prisma/build/index.js generate --schema=packages/backend/prisma/schema.prisma

echo "=== Running prisma migrate deploy ==="
node ./node_modules/prisma/build/index.js migrate deploy --schema=packages/backend/prisma/schema.prisma

echo "=== Build complete ==="
