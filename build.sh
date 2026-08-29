#!/bin/bash
set -ex

echo "=== Removing workspace config ==="
node -e "const p=require('./package.json'); delete p.workspaces; require('fs').writeFileSync('package.json',JSON.stringify(p,null,2));"

echo "=== Installing root deps (prisma) ==="
npm install --include=dev

echo "=== Running prisma generate + migrate ==="
node ./node_modules/prisma/build/index.js generate --schema=packages/backend/prisma/schema.prisma
node ./node_modules/prisma/build/index.js migrate deploy --schema=packages/backend/prisma/schema.prisma

echo "=== Installing backend deps ==="
cd packages/backend
npm install --omit=dev

echo "=== Build complete ==="
