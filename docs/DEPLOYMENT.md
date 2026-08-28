# Deployment Guide — Render (Monorepo)

## Architecture

This is a **monorepo** with two independent services:

```
packages/
  backend/   → Node.js/Express API (Render Web Service)
  frontend/  → React/Vite SPA (Render Static Site)
```

## Prerequisites

1. A [Render](https://render.com) account
2. A GitHub repository at `https://github.com/Ammarbashirharuna/LMS-ERP`
3. A PostgreSQL database (Render-managed or external)

## Option A: Render Blueprint (Recommended)

### Step 1: Create the database

1. Go to **Render Dashboard → New → PostgreSQL**
2. Name it `lms-erp-db`
3. Once created, copy the **Internal Database URL**

### Step 2: Deploy Backend

1. Go to **Render Dashboard → New → Web Service**
2. Connect the GitHub repo
3. Configure:
   - **Name**: `lms-erp-backend`
   - **Runtime**: Node
   - **Root Directory**: `packages/backend`
   - **Build Command**:
     ```
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```
     npx tsx src/index.ts
     ```
   - **Plan**: Starter ($7/mo)

4. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<your PostgreSQL connection string>
   JWT_SECRET=7ff75255c44153d781fbe074ef0f8e7e1de93d68b7841d988a62452b6a30d587
   JWT_REFRESH_SECRET=<generate another random 64-char string>
   PORT=4000
   FRONTEND_URL=https://lms-erp-frontend.onrender.com
   PAYSTACK_SECRET_KEY=<optional - your Paystack key>
   ```

5. Click **Create Web Service**

> **Important**: Render runs `prisma migrate deploy` during the build step — this handles all database migrations automatically without needing a shell command post-deploy.

### Step 3: Deploy Frontend

1. Go to **Render Dashboard → New → Static Site**
2. Connect the same GitHub repo
3. Configure:
   - **Name**: `lms-erp-frontend`
   - **Root Directory**: `packages/frontend`
   - **Build Command**:
     ```
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

4. Add a **Rewrite Rule**:
   - **Source**: `/**`
   - **Destination**: `/index.html`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://lms-erp-backend.onrender.com
   ```

6. Click **Create Static Site**

### Step 4: Update Frontend API URL

After the backend is deployed, update the frontend's `vite.config.ts` proxy and `api/client.ts` to point to the backend URL:

```typescript
// packages/frontend/src/api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "/api/v1",
  timeout: 10000,
});
```

## Option B: Docker (Backend Only)

If you prefer Docker for the backend:

```bash
# Build and push
cd packages/backend
docker build -t lms-erp-backend .
docker tag lms-erp-backend your-registry/lms-erp-backend
docker push your-registry/lms-erp-backend
```

Use the Dockerfile at `packages/backend/Dockerfile`.

## How Prisma Migrations Work on Render

Render does **not** allow shell commands after deploy. We solve this by running migrations **during the build step**:

```
buildCommand: npm install && npx prisma generate && npx prisma migrate deploy
```

This means:
1. `npm install` — installs all dependencies
2. `npx prisma generate` — generates the Prisma client
3. `npx prisma migrate deploy` — applies all pending migrations to the database

**No post-deploy script needed.** Every time Render rebuilds the service, migrations are applied automatically.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for refresh tokens |
| `PORT` | ✅ | Server port (default: 4000) |
| `NODE_ENV` | ✅ | `production` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `PAYSTACK_SECRET_KEY` | ❌ | Paystack secret key for payments |
| `RESEND_API_KEY` | ❌ | Resend API key for email |
| `VITE_API_URL` | ✅ | Backend URL for frontend |

## Seed Data

The database is seeded automatically via `prisma/seed.ts`. Default credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sunrisemontessori.edu | demopass123 |
| Teacher | teacher@sunrisemontessori.edu | demopass123 |
| Parent | parent@sunrisemontessori.edu | demopass123 |
| Student | student@sunrisemontessori.edu | demopass123 |

## Post-Deployment Checklist

- [ ] Backend health check: `https://lms-erp-backend.onrender.com/api/v1/settings`
- [ ] Frontend loads: `https://lms-erp-frontend.onrender.com`
- [ ] Login works with demo credentials
- [ ] All settings save and persist
- [ ] Messages can be sent
- [ ] Invoices can be created
- [ ] Report cards display with school branding
