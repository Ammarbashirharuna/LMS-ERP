FROM node:20-slim AS base

# Install only the necessary system dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy source code
COPY . .

# Build (optional — we run tsx directly)
# RUN npx tsc

EXPOSE 4000

# Start the server
CMD ["npx", "tsx", "src/index.ts"]
