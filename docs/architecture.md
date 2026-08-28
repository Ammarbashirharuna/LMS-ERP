# Architecture Overview — Montessori ERP & LMS

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React PWA)                        │
│  - Role-based UI shells (Admin / Teacher / Parent / Student) │
│  - IndexedDB offline store (Dexie.js) + Sync queue           │
│  - AI Assistant chat widget                                  │
│  - TanStack Query for server state management                │
└───────────────────────────┬─────────────────────────────────┘
                             │ HTTPS / REST + WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                  API GATEWAY (Express.js)                     │
│  - Auth middleware (JWT + refresh tokens)                     │
│  - Tenant resolution middleware                               │
│  - RBAC authorization middleware                              │
│  - Rate limiting / request validation (Zod)                   │
│  - Audit logging middleware                                   │
└───────────────────────────┬─────────────────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        ▼                    ▼                     ▼
┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│  Core Modules │   │  AI Service    │   │  Sync Service     │
│  (Modular     │   │  (Local data   │   │  (Offline queue   │
│  Express      │   │  analysis +    │   │  reconciliation)  │
│  routers)     │   │  Gemini API)   │   │                   │
└───────┬───────┘   └────────┬───────┘   └─────────┬─────────┘
        │                    │                      │
        ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│   PostgreSQL on Neon (multi-tenant, row-level isolation)     │
│   Redis on Upstash (sessions, rate limiting, caching)        │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + Tailwind CSS | SPA with HMR, utility-first CSS |
| State | TanStack Query | Server state caching, optimistic updates |
| Offline | Dexie.js (IndexedDB) | Local data store for offline operations |
| Backend | Node.js + Express.js | REST API server |
| ORM | Prisma | Type-safe database queries |
| Database | PostgreSQL (Neon) | Multi-tenant relational data |
| Cache | Redis (Upstash) | Rate limiting, session tokens |
| Auth | JWT + bcrypt | Stateless authentication |
| AI | Local data analysis + optional Gemini | Insights and assistant |
| Icons | Lucide React | Consistent icon system |

## Multi-Tenancy

- **Shared database, shared schema** with `tenant_id` discriminator
- Every tenant-scoped table has a `tenantId` column with an index
- Middleware resolves `tenant_id` from JWT and injects it into all queries
- No route can accidentally leak cross-tenant data

## RBAC Model

```
Role → [Permission]
Permission = { resource, action }
```

| Role | Scope | Key Permissions |
|------|-------|----------------|
| Admin | Tenant-wide | Full CRUD on all modules |
| Teacher | Class-level | Students (read), Attendance, Observations, Curriculum, Messages |
| Parent | Own children | Students (read), Attendance (read), Observations (read), Finance (read) |
| Student | Self only | Curriculum (read), Announcements (read) |

## Data Storage Decision

**PostgreSQL (source of truth):**
- All core entities: tenants, users, roles, students, classes, curriculum, observations, attendance, invoices, payments, staff, materials, messages, announcements, audit logs

**Redis (ephemeral, performance):**
- Rate limiting counters
- Session/refresh token blocklist
- Short-lived caches

**IndexedDB (client-side offline):**
- Pending attendance records
- Pending observation records
- Sync queue for reconciliation

**Rule:** If losing the data on restart would break the app, it belongs in PostgreSQL.

## AI Architecture

### AI Insights (Student Progress Reports)
- Queries student data (attendance, observations, curriculum progress)
- Analyzes patterns: attendance rate, mastery progression, area coverage
- Generates actionable recommendations
- Returns markdown-formatted report

### AI Assistant (Chat Widget)
- Pattern-based responses for common queries
- Queries database for real-time data
- Role-scoped: different responses for admin/teacher/parent/student
- Supports: student counts, attendance summaries, observation lists, class info, finance overview

## Offline-First Design

**Scope:** Attendance and Observation logging

1. **Client:** Dexie.js stores pending writes in IndexedDB
2. **Sync Service:** Periodic sync on reconnect (every 30s + on online event)
3. **Conflict Resolution:** Last-write-wins with conflict flagging
4. **UI Indicator:** Persistent sync status badge (Synced / Pending / Offline)
