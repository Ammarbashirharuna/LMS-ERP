#!/bin/bash
set -ex

echo "=== Step 1: Install workspace deps ==="
npm install

echo "=== Step 2: Find prisma binary ==="
# After npm install with workspaces, prisma should be in root node_modules
# Create .bin symlink if missing (npm workspace hoisting quirk)
if [ ! -f "./node_modules/.bin/prisma" ] && [ -f "./node_modules/prisma/build/index.js" ]; then
  mkdir -p ./node_modules/.bin
  ln -sf ../prisma/build/index.js ./node_modules/.bin/prisma
fi

echo "=== Running prisma generate ==="
node ./node_modules/prisma/build/index.js generate --schema=packages/backend/prisma/schema.prisma

echo "=== Running prisma migrate deploy ==="
node ./node_modules/prisma/build/index.js migrate deploy --schema=packages/backend/prisma/schema.prisma

echo "=== Build complete ==="
