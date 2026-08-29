#!/bin/bash
set -ex

echo "=== Removing workspace config to allow normal npm install ==="
node -e "const p=require('./package.json'); delete p.workspaces; require('fs').writeFileSync('package.json',JSON.stringify(p,null,2));"

echo "=== Installing all deps (including prisma) ==="
npm install

echo "=== Verifying prisma exists ==="
ls ./node_modules/prisma/build/index.js || { echo "FATAL: prisma not found"; exit 1; }

echo "=== Running prisma generate ==="
node ./node_modules/prisma/build/index.js generate --schema=packages/backend/prisma/schema.prisma

echo "=== Running prisma migrate deploy ==="
node ./node_modules/prisma/build/index.js migrate deploy --schema=packages/backend/prisma/schema.prisma

echo "=== Build complete ==="
