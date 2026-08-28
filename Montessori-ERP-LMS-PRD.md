# Montessori ERP & LMS — Master Product Requirements Document (PRD)

**Version:** 1.0
**Author:** [Your Name]
**Stack:** Node.js, Express.js, PostgreSQL (Neon), Redis, React, Socket.io, Google Gemini API
**Deployment:** Render (API + Frontend) + Neon (Database) + Upstash (Redis)
**Brand Palette:** Snow White (#FAFAF9) base, Signal Orange (#FF6B35) accent
**Timeline:** 9-day build sprint
**Status:** Draft for implementation

---

## 1. Executive Summary

The Montessori ERP & Learning Management System (LMS) is a multi-tenant, role-based platform designed to unify academic operations, curriculum delivery, student progress tracking, communication, finance, HR, and inventory management for Montessori schools. The platform is architected to be **API-first, offline-capable, and AI-augmented**, allowing schools to operate reliably in low-connectivity environments while giving administrators, teachers, and parents meaningful, real-time insight into student development.

This document defines the full technical and functional scope, system architecture, data model, API contracts, and a realistic 9-day delivery plan that prioritizes a deep, production-quality vertical slice over a shallow implementation of every feature.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Deliver a multi-tenant SaaS-style ERP/LMS where each school ("tenant") has isolated data and configurable roles.
- Implement Montessori-specific pedagogy tools: curriculum planning, observation-based progress tracking, and individualized learning paths.
- Provide a genuinely useful AI layer (insights + assistant), not decorative text generation.
- Support offline-first usage for the highest-friction daily workflows (attendance, observations).
- Ship a live, deployed, demoable system with clean documentation and a public GitHub repo.

### 2.2 Non-Goals (for this sprint)
- Full enterprise-grade HR/payroll compliance (tax rules, multi-currency payroll) — a simplified model will be implemented and clearly marked as such.
- Native mobile apps — the web app will be responsive and installable as a PWA instead.
- Deep inventory forecasting/procurement automation — basic CRUD + stock alerts only.

These are documented in the Roadmap (Section 12) as intentionally deferred, which is itself a signal of mature engineering judgment rather than a gap.

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React PWA)                    │
│  - Role-based UI shells (Admin / Teacher / Parent / Student)  │
│  - IndexedDB offline store + Service Worker sync queue        │
│  - AI Assistant chat widget                                   │
└───────────────────────────┬────────────────────────────────┘
                             │ HTTPS / REST + WebSocket
┌───────────────────────────▼────────────────────────────────┐
│                  API GATEWAY (Express.js)                    │
│  - Auth middleware (JWT + refresh tokens)                     │
│  - Tenant resolution middleware                                │
│  - RBAC authorization middleware                               │
│  - Rate limiting / request validation (Zod)                    │
└───────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        ▼                    ▼                     ▼
┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│  Core Services │   │  AI Service     │   │  Sync Service     │
│  (Modular      │   │  (Insights +    │   │  (Offline queue   │
│  Express       │   │  Assistant via  │   │  reconciliation)  │
│  routers)      │   │  LLM API)       │   │                   │
└───────┬───────┘   └────────┬────────┘   └─────────┬─────────┘
        │                    │                       │
        ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│   PostgreSQL on Neon (multi-tenant, row-level isolation,       │
│   permanent free tier — system of record)                      │
│   Redis on Upstash (sessions, rate limiting, job queue,         │
│   AI insight cache — ephemeral, never source of truth)          │
└─────────────────────────────────────────────────────────────┘
```

External calls: `AI Service` → Google Gemini API (`gemini-2.5-flash-lite`, server-side key only, never exposed to the client).

### 3.2 Tech Stack Rationale

| Layer | Choice | Reason |
|---|---|---|
| Backend runtime | Node.js + Express.js | Fast to build, matches candidate's JS strength, huge middleware ecosystem |
| Language | TypeScript | Type safety across a large multi-module codebase |
| Database | **PostgreSQL, hosted on Neon** (free tier, permanent — not Render's Postgres, which auto-expires after 30 days) | Relational integrity for ERP data, native row-level security for multi-tenancy, survives past the assessment deadline for a live portfolio demo |
| ORM | Prisma | Fast schema iteration, type-safe queries, migrations |
| Cache/Queue | **Redis, hosted on Upstash** (free tier, serverless, pay-per-request — pairs cleanly with Render, unlike Render's own Redis which is also expiring/paid-only) + BullMQ | See Section 3.3 for exact data stored in Redis vs. Postgres |
| Auth | JWT (access + refresh) via jsonwebtoken, bcrypt for hashing | Stateless, scalable, standard practice |
| Realtime | Socket.io | Live notifications, chat/messaging module |
| Frontend | React + Vite + Tailwind CSS | Fast build, clean modern UI (see Section 10 for the full design system) |
| Offline | Workbox (service worker) + IndexedDB (Dexie.js) | Reliable offline caching and sync queue |
| AI | **Google Gemini API — `gemini-2.5-flash-lite`** via backend proxy (free tier: no card required, ~15 req/min, ~1,000+ req/day — more than sufficient for a demo/assessment project) | Server-side key security, structured JSON output via function calling, generous free context window |
| Validation | Zod | Shared schema validation client/server |
| Testing | Jest + Supertest | Unit + integration coverage on core modules |
| Deployment | **Render** (Node API as a Web Service + React app as a Static Site), **Neon** (Postgres), **Upstash** (Redis) | Entirely free-tier, all three survive past a 9-day sprint; note Render's free Web Service spins down after 15 min idle and takes a few seconds to wake — document this in the README so it isn't mistaken for a bug |
| CI/CD | GitHub Actions | Lint, test, build on push, auto-deploy to Render on merge to `main` |

### 3.3 Data Storage Split — What Lives Where

Reviewers and interviewers specifically look for whether a candidate understands *why* a piece of data lives in a given store, not just that "Redis is used." Be explicit about this, both in the PRD and out loud in an interview:

**Lives in PostgreSQL (source of truth, durable, relational):**
- All core entities: tenants, users, roles/permissions, students, guardians, classes, curriculum, lesson plans, observations, attendance records, invoices, payments, staff, leave requests, materials, messages, announcements, audit log.
- Anything that must survive a server restart, be queryable/joinable, or be reported on.

**Lives in Redis (ephemeral, fast, non-authoritative):**
- **Session/refresh-token blocklist** — revoked tokens, keyed by `jti`, with TTL matching token expiry.
- **Rate-limiting counters** — per-IP and per-user request counts (`rate:{userId}:{route}`), sliding window via `express-rate-limit` + `rate-limit-redis`.
- **BullMQ job queues** — background jobs: offline-sync reconciliation, AI insight regeneration (scheduled, not per-request), email/notification dispatch.
- **AI Insights cache** — generated insight JSON cached per `tenant_id:student_id` with a TTL (e.g. 6–12 hours) so the Gemini API isn't called on every dashboard load — this directly protects the free-tier rate limit and is worth calling out as a deliberate cost/performance decision.
- **Socket.io adapter** — presence and pub/sub for realtime messaging/notifications if the API ever runs multiple instances.
- **Short-lived caches** — e.g., curriculum tree (rarely changes, expensive to compute the progress overlay), cached per tenant with invalidation on write.

**Rule of thumb stated plainly in the doc (and to any interviewer who asks):** *if losing the data on a Redis restart would break the app, it doesn't belong in Redis — it belongs in Postgres.* Redis here is strictly a performance/ephemeral layer, never the system of record.

---

## 4. Multi-Tenancy & RBAC

### 4.1 Multi-Tenancy Model
- **Shared database, shared schema, tenant_id discriminator column** on every tenant-scoped table (most practical for a 9-day build vs. schema-per-tenant).
- Middleware resolves `tenant_id` from subdomain or JWT claim on every request and injects it into the Prisma query context automatically (via Prisma middleware) so no route can accidentally leak cross-tenant data.
- Tenant onboarding flow: super-admin creates a school (tenant) → generates first Admin user → school configures branding, roles, academic calendar.

### 4.2 Roles

| Role | Scope | Key Permissions |
|---|---|---|
| Super Admin | Platform-wide | Manage tenants, billing, global settings |
| School Admin | Tenant-wide | Manage users, classes, finance, HR, settings |
| Teacher | Class-level | Manage lesson plans, observations, attendance, grades |
| Parent | Own children only | View progress, attendance, invoices, messages |
| Student | Self only | View assigned learning materials, gamified progress |
| Finance/HR Staff | Tenant-wide (module-scoped) | Manage fees, payroll, inventory |

### 4.3 RBAC Implementation
- Permissions modeled as `role → [resource:action]` pairs stored in DB (not hardcoded), so schools can customize roles later.
- Express middleware `requirePermission('students:read')` checks the resolved role's permission set before hitting the controller.
- Audit log table records every write action with `user_id`, `tenant_id`, `action`, `resource`, `timestamp` for accountability — this is a strong, cheap-to-build feature that reviewers notice.

---

## 5. Core Modules & Feature Specification

### 5.1 Authentication & User Management
- Email/password + JWT auth, refresh token rotation, password reset via email token.
- Invite-based onboarding (Admin invites Teacher/Parent via email link).
- Account states: pending, active, suspended.

### 5.2 Montessori Curriculum & Lesson Planning
- Curriculum library organized by **Montessori areas**: Practical Life, Sensorial, Language, Mathematics, Cultural/Science.
- Lesson plan builder: teachers create/reuse lesson plans, tag by area + age band + material used.
- Materials catalog linked to lessons (tracks which physical Montessori materials a lesson requires).
- Individual learning path per student: teacher assigns/tracks progression through curriculum tree.

### 5.3 Observation & Student Progress Tracking
- Structured observation entries: teacher logs freeform notes + tags (mastery level: Introduced / Practicing / Mastered) against curriculum items.
- Progress dashboard per student: visual curriculum-tree completion map.
- Historical timeline view of a student's observations for parent-teacher conferences.

### 5.4 Student Profiles & Smart Attendance
- Student profile: demographics, guardians, medical notes, enrollment history.
- Attendance: daily check-in/out, QR-code or manual entry, absence reason codes.
- "Smart" layer: attendance anomaly detection (e.g., pattern of Monday absences) surfaced via AI Insights.
- **This module is offline-first** (see Section 7).

### 5.5 Gamified Learning / Micro-Learning
- Student-facing point/badge system tied to completed micro-lessons and observed mastery milestones.
- Simple micro-learning content blocks (short activity + self-check) assignable by teachers.
- Leaderboard scoped to a class (opt-in, privacy-conscious — no cross-class ranking of young children).

### 5.6 Fees, Finance, HR & Inventory
- **Fees:** fee structures per grade/term, invoice generation, payment recording (manual/mock gateway), outstanding balance dashboard.
- **Finance:** basic income/expense ledger, exportable reports (CSV).
- **HR:** staff records, attendance, leave requests/approval workflow.
- **Inventory:** Montessori materials stock tracking, low-stock alerts, checkout log (which classroom holds which material).

### 5.7 Communication & Administration
- In-app messaging between teacher ↔ parent (threaded, per-student context).
- Announcements module (school-wide or class-specific), with read receipts.
- Admin dashboard: enrollment stats, attendance trends, finance summary, staff overview.

### 5.8 AI Insights
- Backend service aggregates structured data (attendance, observations, fee status) and sends a **summarized, anonymized prompt** to `gemini-2.5-flash-lite` to generate:
  - Per-student progress summaries for parent-teacher meetings.
  - Class-level trend flags (e.g., "3 students show declining attendance this month").
  - Curriculum coverage gaps (areas under-taught relative to age band).
- Insights are generated on a **scheduled BullMQ job (e.g., nightly per class)**, not on every page load, and the result is cached in Redis with a 6–12 hour TTL. This is a deliberate, documented decision — it controls Gemini's free-tier rate limit (~15 req/min, ~1,000+ req/day), keeps costs at literal $0, and produces more meaningful insights than regenerating on every click. Worth stating explicitly in the README/decisions log — it reads as engineering maturity, not a limitation you're hiding.
- If the Gemini call fails or the rate limit is hit, the endpoint serves the last cached insight with a "last updated" timestamp rather than erroring — graceful degradation.

### 5.9 AI Assistant
- Context-aware chat assistant scoped by role, powered by `gemini-2.5-flash-lite`:
  - Teacher: "Which students haven't had a Sensorial observation this month?"
  - Parent: "How is my child progressing in Math?"
  - Admin: "Summarize this term's fee collection status."
- Implemented as a backend endpoint that **fetches relevant tenant-scoped data first** (function-calling / tool pattern against Postgres), then passes a grounded, structured context window to Gemini — avoiding hallucinated numbers. The model never receives raw DB credentials or unscoped data; the backend always pre-filters by `tenant_id` and role permissions before the prompt is built.
- Rate-limit awareness: assistant requests are user-triggered (not polled), and a simple per-user cooldown (enforced via the Redis rate-limiting counters in Section 3.3) prevents accidental free-tier exhaustion during a demo.

### 5.10 Offline-First Approach
See Section 7 for full detail. Scope: Attendance marking + Observation logging work fully offline; sync reconciles on reconnect.

---

## 6. Data Model (Core Entities)

```
Tenant (id, name, subdomain, plan, created_at)
User (id, tenant_id, email, password_hash, role_id, status)
Role (id, tenant_id, name, is_system_role)
Permission (id, role_id, resource, action)
Student (id, tenant_id, first_name, last_name, dob, guardian_ids[], class_id)
Guardian (id, tenant_id, user_id, student_ids[], relationship)
ClassRoom (id, tenant_id, name, teacher_ids[], academic_year)
CurriculumArea (id, name) — Practical Life, Sensorial, Language, Math, Cultural
CurriculumItem (id, area_id, title, age_band, material_ids[])
LessonPlan (id, tenant_id, teacher_id, curriculum_item_id, content, created_at)
Observation (id, tenant_id, student_id, teacher_id, curriculum_item_id, note, mastery_level, created_at)
Attendance (id, tenant_id, student_id, date, status, sync_status, recorded_offline_at)
Material (id, tenant_id, name, quantity, location, low_stock_threshold)
FeeStructure (id, tenant_id, grade, term, amount)
Invoice (id, tenant_id, student_id, fee_structure_id, status, due_date)
Payment (id, tenant_id, invoice_id, amount, method, paid_at)
Staff (id, tenant_id, user_id, position, salary, leave_balance)
LeaveRequest (id, staff_id, start_date, end_date, status)
Message (id, tenant_id, thread_id, sender_id, content, created_at)
Announcement (id, tenant_id, class_id_nullable, title, body, created_at)
AuditLog (id, tenant_id, user_id, action, resource, meta, created_at)
```

All tenant-scoped tables carry `tenant_id` with a composite index `(tenant_id, id)` and Prisma middleware enforcement to prevent cross-tenant leakage.

---

## 7. Offline-First Design

**Scope for this sprint:** Attendance and Observation logging (the two highest-frequency daily teacher actions).

1. **Client:** Dexie.js (IndexedDB wrapper) stores a local queue of pending writes when network is unavailable (`navigator.onLine === false` or failed fetch).
2. **Service Worker (Workbox):** caches the app shell + last-synced student roster so the UI is usable with zero connectivity.
3. **Sync Service:** on reconnect, queued writes are POSTed in order with a client-generated UUID + timestamp; server uses **last-write-wins with conflict flagging** — if a record was modified server-side after the offline write's timestamp, it's flagged for teacher review rather than silently overwritten.
4. **UI indicator:** a persistent sync-status badge (Synced / Pending / Conflict) so users trust the system.

This is deliberately scoped narrow and deep rather than "offline everywhere," which would be shallow and buggy in 9 days.

---

## 8. API Design (Representative Endpoints)

All routes are prefixed `/api/v1` and require `Authorization: Bearer <token>` except auth routes.

```
POST   /auth/register              # tenant + first admin
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /students                   # list (paginated, filterable)
POST   /students
GET    /students/:id
PATCH  /students/:id

POST   /attendance                 # supports offline batch upsert
GET    /attendance?date=&class_id=

POST   /observations
GET    /observations/student/:id

GET    /curriculum/tree            # full curriculum with progress overlay per student

POST   /invoices
GET    /invoices/student/:id
POST   /payments

GET    /staff
POST   /leave-requests
PATCH  /leave-requests/:id/approve

GET    /materials
PATCH  /materials/:id/stock

POST   /messages/thread/:id
GET    /announcements

GET    /ai/insights/student/:id
POST   /ai/assistant/chat          # { role-scoped context, message }

GET    /audit-log                  # admin only
```

Each endpoint is documented with OpenAPI 3.0 (`/docs` served via Swagger UI) — this alone is a strong signal of professionalism for the documentation criterion.

---

## 9. Non-Functional Requirements

- **Security:** bcrypt password hashing, JWT short-lived access tokens (15m) + rotating refresh tokens, Helmet.js headers, input validation via Zod on every route, rate limiting on auth routes.
- **Performance:** paginated list endpoints, DB indexes on all foreign keys + tenant_id, Redis caching for AI insight results.
- **Reliability:** graceful error handling middleware, structured logging (pino), health-check endpoint for deployment monitoring.
- **Accessibility:** semantic HTML, keyboard navigation, color-contrast-compliant Tailwind theme.
- **Testing:** unit tests for auth, RBAC middleware, and attendance sync logic minimum; integration tests for core CRUD flows.

---

## 10. Frontend Design System

This is the single source of truth for visual design. An implementation agent should treat this section as binding — no ad-hoc color/spacing decisions outside of it. The goal is a **warm, calm, professional** interface (appropriate for a Montessori school, not a generic SaaS admin panel) built on a snow-white base with a confident orange accent.

### 10.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#FAFAF9` (Snow White) | App background, base canvas |
| `--color-surface` | `#FFFFFF` | Cards, panels, modals — sits on top of `--color-bg` with a subtle shadow, not a border, to imply elevation |
| `--color-surface-muted` | `#F3F2EF` | Secondary panels, table row stripes, disabled states |
| `--color-primary` | `#FF6B35` (Signal Orange) | Primary buttons, active nav item, key CTAs, focus rings |
| `--color-primary-hover` | `#E85A2A` | Hover/active state of primary elements |
| `--color-primary-subtle` | `#FFE8DC` | Badge backgrounds, selected-row highlight, chip backgrounds |
| `--color-text` | `#1F1B16` | Primary body text (warm near-black, not pure `#000`, to match the warm palette) |
| `--color-text-muted` | `#6B6560` | Secondary text, labels, helper text |
| `--color-border` | `#E7E4DE` | Card borders, dividers, table borders |
| `--color-success` | `#2E7D4F` | Confirmations, "Mastered" status, synced indicator |
| `--color-warning` | `#C98A1E` | Pending sync, low-stock alerts |
| `--color-danger` | `#C4432B` | Destructive actions, overdue invoices, conflicts |

Rules:
- Orange is an **accent**, never a large fill. No full-page orange backgrounds, no orange sidebars. Use it for buttons, active states, key data points, and the logo mark only — this is what keeps "orange + white" reading as premium rather than like a fast-food brand.
- Never place orange text on white at small sizes for body copy — use `--color-text` for readability; reserve orange for interactive/emphasis elements only.
- All color pairs must meet WCAG AA contrast (4.5:1 for body text) — verify `--color-primary` on `--color-bg` is used only for large text/icons/buttons with sufficient padding, not small inline links.

### 10.2 Typography

- **Font:** `Inter` (UI text) — free, excellent legibility at small sizes, wide weight range. Load via `@fontsource/inter` (no external CDN dependency, keeps it offline-friendly).
- **Scale:** `text-xs` (12px, captions/badges) → `text-sm` (14px, body/table) → `text-base` (16px, default) → `text-lg` (18px, section headers) → `text-2xl` (24px, page titles) → `text-3xl` (30px, dashboard hero numbers).
- **Weight:** 400 body, 500 labels/table headers, 600 buttons/nav, 700 page titles only. Avoid overusing bold — reserve 700 for true hierarchy anchors.

### 10.3 Spacing, Radius & Elevation

- **Spacing scale:** Tailwind default 4px base unit (`p-2`, `p-4`, `p-6`, `p-8`) — no arbitrary pixel values in components.
- **Border radius:** `rounded-xl` (12px) on cards/modals, `rounded-lg` (8px) on buttons/inputs, `rounded-full` on avatars/badges — soft, warm, consistent with the Montessori "gentle" brand feel, never sharp 0-radius corners.
- **Elevation:** two shadow levels only — `shadow-sm` for resting cards, `shadow-md` for modals/dropdowns. No heavy drop shadows.

### 10.4 Core Components (build once, reuse everywhere)

- `Button` — variants: `primary` (orange fill), `secondary` (white, orange border/text), `ghost` (text-only), `danger`. Sizes: sm/md/lg. Consistent 8px icon gap.
- `Card` — white surface, `rounded-xl`, `shadow-sm`, `p-6`, optional header slot.
- `Badge` — status pills (Synced/Pending/Conflict, Introduced/Practicing/Mastered, Paid/Overdue) using the semantic colors above, never raw orange for non-primary statuses.
- `DataTable` — sticky header, zebra striping via `--color-surface-muted`, empty/loading/error states built in (see 10.6).
- `Modal`, `Drawer` — for forms (observation entry, invoice creation).
- `NavShell` — role-aware sidebar; active item uses `--color-primary-subtle` background + orange left-border accent, not a full orange fill.
- `StatCard` — dashboard KPI tiles (e.g., "Attendance Today: 94%") with a large `text-3xl` number and small trend indicator.

### 10.5 Layout

- **Sidebar + topbar shell**, collapsible sidebar on tablet/mobile (attendance is frequently taken on a tablet in-classroom — this must never feel cramped).
- Content max-width constrained on large screens (don't stretch tables/forms edge-to-edge on ultrawide monitors).
- Mobile-first breakpoints: base styles for mobile, `md:` for tablet, `lg:` for desktop — attendance/observation screens are designed mobile-first specifically, everything else desktop-first is acceptable.

### 10.6 States (build these intentionally, not as an afterthought)

- **Empty state:** icon + one-line explanation + primary action (e.g., "No students yet — Add your first student").
- **Loading state:** skeleton loaders matching the final layout shape, not a generic spinner, for any list/table/dashboard.
- **Error state:** clear message + retry action, styled with `--color-danger` accents only (not a full red screen).
- **Offline/sync state:** persistent, calm badge (not a scary red banner) — orange/warning tone for "Pending," green for "Synced," per Section 7.

### 10.7 Implementation Notes for the Coding Agent

- Define all tokens above as CSS variables in `:root` (or a Tailwind theme extension in `tailwind.config.js`) **once**, on day 1, before building any screen — every component references tokens, never raw hex values.
- Build the component library (10.4) as its own folder (`/components/ui`) before building feature screens, so every module (attendance, curriculum, finance, etc.) composes from the same primitives instead of re-inventing buttons/cards per screen.
- Role-specific dashboards (Admin/Teacher/Parent/Student) reuse the same `NavShell` and component set — only the nav items and page content differ, not the visual language.

---

## 11. Additional / Unique Features (proposed, pick 2–3 to actually build)

1. **Conflict-aware offline sync with visible resolution UI** (already scoped in core — strong differentiator).
2. **Parent-teacher meeting auto-briefing:** one-click AI-generated summary PDF combining attendance, observations, and fee status for a student.
3. **Curriculum coverage heatmap:** visual showing which Montessori areas are under-taught across a class over a term.
4. **Audit log + tenant activity feed** for transparency/trust.
5. **PWA installability** — "Add to Home Screen" for low-resource school environments.

Pick features that reinforce the "professional, production-minded engineer" narrative rather than adding unrelated flash.

---

## 12. Roadmap / Explicitly Deferred (documented, not hidden)

- Full payroll tax computation — simplified gross/net only.
- Multi-language i18n — architecture left extensible (all UI strings centralized) but only English shipped.
- Native mobile apps — PWA only.
- Advanced inventory forecasting — basic stock levels + alerts only.
- Video-based micro-learning content — text/image-based micro-lessons only for this sprint.

Documenting this explicitly in the README is a deliberate, senior-engineer move: it shows scope control, not laziness.

---

## 13. 9-Day Execution Plan

| Day | Focus |
|---|---|
| 1 | Project scaffolding: monorepo (backend/frontend), Prisma schema, auth + multi-tenant middleware, CI setup |
| 2 | RBAC system, user/role management, tenant onboarding flow, audit log |
| 3 | Student profiles, class management, attendance (online path) |
| 4 | Offline-first attendance + observation logging (client + sync service) |
| 5 | Curriculum module, lesson planning, progress tracking dashboard |
| 6 | Fees/Finance module + basic HR (staff, leave) + Inventory |
| 7 | Communication (messaging, announcements), Gamification layer |
| 8 | AI Insights + AI Assistant integration, polish UI/UX across all role dashboards |
| 9 | Deployment (backend, frontend, DB), Swagger docs, README, architecture doc, demo data seeding, final QA pass |

Buffer note: if time runs short, cut from Section 5.6 (HR/Inventory depth) and Section 5.5 (Gamification) first — they contribute less to the "complex systems engineer" narrative than curriculum/observation/offline/AI do.

---

## 14. Documentation Deliverables (for the 10-mark criterion)

- `README.md`: project overview, features, setup instructions, screenshots/GIF demo, live demo link, tech stack, architecture diagram.
- `/docs/architecture.md`: this PRD's Section 3 expanded with actual implementation notes.
- `/docs/api.md` or hosted Swagger UI.
- `/docs/decisions.md`: short ADR-style log of key technical decisions and trade-offs (this is a strong, cheap signal of engineering maturity).
- Seed script producing realistic demo data (a few classes, students, observations, invoices) so evaluators can explore a populated system immediately.

---

## 15. Environment & Account Setup (do this before handing off to a coding agent)

Set these up yourself first — an agent can write code, but account creation/API keys need a human:

1. **Neon** (neon.tech) → create a free project → copy the pooled connection string → `DATABASE_URL`.
2. **Upstash** (upstash.com) → create a free Redis database → copy the REST URL/token or `redis://` connection string → `REDIS_URL`.
3. **Google AI Studio** (aistudio.google.com) → generate a free Gemini API key → `GEMINI_API_KEY`. Confirm the key defaults to `gemini-2.5-flash-lite`.
4. **Render** (render.com) → connect your GitHub repo → create one Web Service (backend) and one Static Site (frontend) → set all env vars from `.env.example` in the Render dashboard, not committed to the repo.
5. **GitHub repo** → add a branch protection rule on `main`, connect GitHub Actions for CI.

**`.env.example` (commit this, never the real `.env`):**
```
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
```

Once these 5 accounts exist and the env vars are in hand, the entire build (Sections 5–14) is unblocked and an agent can work end-to-end without stopping to ask you for credentials mid-sprint.

---

## 16. Definition of Done

- [ ] Deployed, publicly accessible URL (frontend + API)
- [ ] Seeded demo accounts for each role documented in README
- [ ] Core modules (Sections 5.1–5.4, 5.8–5.10) fully functional end-to-end
- [ ] At least one offline-capable workflow demonstrably works with network disabled
- [ ] AI Insights and AI Assistant return real, data-grounded responses (not generic text)
- [ ] Swagger/OpenAPI docs live
- [ ] README + architecture + decisions docs complete
- [ ] Basic test suite passing in CI

### 16.1 Interview-Readiness Check (do this even if not asked)

Before you submit, be able to answer these out loud in under 30 seconds each — this is what actually separates candidates who "built something" from candidates who can *explain* what they built and why:
- Why Postgres for the core data and Redis only for ephemeral data (Section 3.3)?
- Why is AI insight generation scheduled/cached instead of live on every request (Section 5.8)?
- How does multi-tenancy prevent one school's data from leaking into another's (Section 4.1)?
- What happens when a teacher marks attendance offline and two conflicting edits sync later (Section 7)?
- What did you deliberately not build, and why (Section 12)?

If you can answer all five clearly, the project defends itself in an interview regardless of how the automated rubric scores it.
