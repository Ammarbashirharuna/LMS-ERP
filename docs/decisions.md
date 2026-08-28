# Architecture Decision Records (ADR)

## ADR-001: Multi-Tenancy via Shared Database

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use shared database with `tenant_id` discriminator column on all tenant-scoped tables.

**Alternatives considered:**
- Schema-per-tenant: Too complex for 9-day sprint, harder to maintain
- Database-per-tenant: Expensive, overkill for target market

**Rationale:** Most practical for a Montessori school ERP. Schools are small (50-500 students), so shared schema scales well. Row-level isolation via `tenant_id` index + Prisma middleware prevents cross-tenant leakage.

---

## ADR-002: JWT Authentication with Refresh Tokens

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use short-lived JWT access tokens (15min) with long-lived refresh tokens (7 days).

**Alternatives considered:**
- Session-based auth: Requires server-side session store, less scalable
- OAuth2: Overkill for school ERP, adds complexity

**Rationale:** Stateless auth is simple to implement and scales well. Refresh tokens allow persistent login without security risks. Passwords hashed with bcrypt (12 rounds).

---

## ADR-003: Local AI Intelligence (No External API Dependency)

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Replace Gemini API dependency with local data analysis that generates insights from database queries.

**Alternatives considered:**
- Gemini API: Requires valid API key, rate limits, network dependency
- OpenAI API: Paid, requires API key

**Rationale:** Free, works offline, no API key required. Generates meaningful insights by analyzing attendance patterns, observation mastery levels, and curriculum progress directly from the database. Gemini integration remains as optional enhancement.

---

## ADR-004: Offline-First via Dexie.js + IndexedDB

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use Dexie.js (IndexedDB wrapper) for offline storage of attendance and observation records.

**Alternatives considered:**
- LocalStorage: Limited to 5MB, synchronous, no indexing
- Service Worker cache only: Can't do structured queries

**Rationale:** IndexedDB provides structured storage with indexing, perfect for queuing writes. Dexie.js simplifies the API. Sync service reconciles on reconnect with last-write-wins strategy.

---

## ADR-005: Tailwind CSS with Custom Design Tokens

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use Tailwind CSS with custom color tokens defined in the PostCSS/Vite config.

**Alternatives considered:**
- CSS Modules: More verbose, harder to maintain consistency
- Styled-components: Runtime overhead, harder to tree-shake

**Rationale:** Utility-first approach enables rapid UI development. Custom tokens ensure visual consistency across all components. CSS variables in `:root` provide fallback for non-Tailwind usage.

---

## ADR-006: Monorepo with Turborepo

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use npm workspaces + Turborepo for monorepo management.

**Alternatives considered:**
- Lerna: Deprecated in favor of modern alternatives
- Nx: More features but heavier setup
- Yarn workspaces: Less tooling support

**Rationale:** Turborepo is fast, simple, and works well with npm workspaces. Shared types between frontend and backend reduce duplication.

---

## ADR-007: TanStack Query for Server State

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use TanStack Query (React Query) for all server state management.

**Alternatives considered:**
- Redux + manual fetching: More boilerplate, no caching
- SWR: Simpler but less features
- Zustand: Client state only, not designed for server state

**Rationale:** Automatic caching, background refetching, optimistic updates, and error handling out of the box. Perfect for REST API integration.

---

## ADR-008: Prisma as ORM

**Date:** 2025-08-25
**Status:** Accepted

**Decision:** Use Prisma for database access and schema management.

**Alternatives considered:**
- TypeORM: Less type-safe, more verbose
- Drizzle: Newer, less mature ecosystem
- Raw SQL: No type safety, harder to maintain

**Rationale:** Prisma provides excellent type safety, auto-generated client, migrations, and studio for data inspection. Perfect for rapid development with PostgreSQL.
