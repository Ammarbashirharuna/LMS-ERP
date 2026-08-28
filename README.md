# 🎓 Montessori ERP & Learning Management System

A modern, scalable, multi-tenant Montessori ERP & LMS built with React, Express.js, Prisma, and PostgreSQL. Designed for Montessori schools to manage students, curriculum, attendance, observations, finances, communication, and more.

## 🌐 Live Demo

- **Frontend**: [https://lms-erp-frontend.onrender.com](https://lms-erp-frontend.onrender.com)
- **Backend API**: [https://lms-erp-backend.onrender.com](https://lms-erp-backend.onrender.com)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sunrisemontessori.edu | demopass123 |
| Teacher | teacher@sunrisemontessori.edu | demopass123 |
| Parent | parent@sunrisemontessori.edu | demopass123 |
| Student | student@sunrisemontessori.edu | demopass123 |

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [Features Implemented](#features-implemented)
- [API Documentation](#api-documentation)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [AI Integration](#ai-integration)
- [Offline-First Approach](#offline-first-approach)
- [RBAC Structure](#rbac-structure)

---

## 🏗 Architecture Overview

```
lms-erp/
├── packages/
│   ├── backend/              # Express.js REST API
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (auth, students, finance, etc.)
│   │   │   ├── core/         # Middleware, router, RBAC
│   │   │   ├── services/     # External services (Paystack)
│   │   │   └── lib/          # Prisma client, utilities
│   │   ├── prisma/           # Schema, migrations, seed
│   │   └── Dockerfile
│   └── frontend/             # React + Vite SPA
│       └── src/
│           ├── pages/        # Route pages (29 pages)
│           ├── components/   # Reusable UI components
│           ├── hooks/        # Custom React hooks
│           ├── api/          # API client modules
│           └── types/        # TypeScript types
├── docs/                     # Documentation
├── render.yaml               # Render deployment config
├── .github/workflows/ci.yml  # CI/CD pipeline
└── turbo.json                # Monorepo tooling
```

### Key Architecture Decisions

1. **Monorepo with Turborepo** — Shared types, single repository, parallel builds
2. **Multi-Tenant via Tenant ID** — Every query is scoped to `tenantId` for data isolation
3. **JWT with Refresh Tokens** — Short-lived access tokens + long-lived refresh tokens
4. **RBAC Middleware** — Permission-based access control on every route
5. **Prisma ORM** — Type-safe database queries with auto-generated migrations
6. **Modular Backend** — Each feature (students, finance, HR) is a self-contained module

---

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **TanStack React Query** for server state management
- **React Router v6** for routing
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT** (jsonwebtoken) for authentication
- **bcryptjs** for password hashing
- **Zod** for request validation
- **express-rate-limit** for rate limiting

### Infrastructure
- **PostgreSQL 16** database
- **Render** for deployment
- **GitHub Actions** for CI/CD
- **Docker** support for containerized deployment

---

## 🗄 Database Design

### Entity Relationship Summary

```
Tenant (1) ──── (N) User
Tenant (1) ──── (N) Student
Tenant (1) ──── (N) ClassRoom
Tenant (1) ──── (N) Staff
Tenant (1) ──── (N) Material
Tenant (1) ──── (N) Invoice
Tenant (1) ──── (N) FeeStructure
Tenant (1) ──── (N) Observation
Tenant (1) ──── (N) Attendance
Tenant (1) ──── (N) Message
Tenant (1) ──── (N) Announcement
Tenant (1) ──── (N) AuditLog

Role (1) ──── (N) Permission
Role (1) ──── (N) User

Student (1) ──── (N) Observation
Student (1) ──── (N) Attendance
Student (1) ──── (N) Invoice
Student (1) ──── (N) BadgeAward
Student (1) ──── (N) Point

Invoice (1) ──── (N) Payment
ClassRoom (1) ──── (N) Student
ClassRoom (1) ──── (N) LessonPlan

Message (1) ──── (N) Message (self-referencing for threads)
Message (1) ──── (N) MessageParticipant
```

### Key Tables (22 models)

| Model | Purpose |
|-------|---------|
| Tenant | Multi-tenant isolation |
| User | Authentication & profiles |
| Role + Permission | RBAC |
| Student | Student profiles |
| ClassRoom | Classroom management |
| Staff | HR & staff management |
| Observation | Montessori observations |
| Attendance | Daily attendance tracking |
| Invoice + Payment | Financial management |
| Message + MessageParticipant | Threaded messaging |
| Announcement + AnnouncementParticipant | School announcements |
| Badge + BadgeAward + Point | Gamification |
| AuditLog | Security audit trail |
| Material + MaterialCheckout | Inventory management |

---

## ✨ Features Implemented

### 1. Multi-Tenant RBAC & Authentication
- **JWT authentication** with access + refresh tokens
- **4 roles**: Admin, Teacher, Parent, Student
- **Permission-based RBAC** on every API endpoint
- **Multi-tenant data isolation** — all queries scoped by `tenantId`
- **Password hashing** with bcryptjs
- **Rate limiting** on auth routes (10 req/15min) and API (500 req/15min)
- **Session timeout** configurable from settings

### 2. School Settings (Comprehensive)
- **7 tabs**: Profile, Academic, Branding, Billing, Notifications, Security, System
- **40+ configurable fields** stored in tenant JSON settings
- **School branding**: Logo, primary/accent colors, motto, tagline
- **Academic config**: Year, terms, school hours, timezone, max students per class
- **Billing**: Currency (8 options), bank details, invoice prefix, late fees, grace period
- **Notifications**: Email, SMS, attendance, grades, payments, parent comms toggles
- **Security**: Password change policy, 2FA (prepared), session timeout
- **Regional**: 6 languages, 3 date formats, timezone

### 3. Student Management
- Full CRUD with responsive table + mobile card layouts
- Student profiles with DOB, gender, class assignment, enrollment date
- Search and filter capabilities
- Edit and delete with confirmation modals

### 4. Montessori Curriculum & Lesson Planning
- **Curriculum areas** (Practical Life, Sensorial, Language, Math, Cultural)
- **Curriculum items** with age bands and material associations
- **Lesson plans** linked to curriculum items and classes
- **Student progress tracking** per curriculum area

### 5. Observation & Progress Tracking
- Teachers record observations with **mastery levels**: Introduced → Practicing → Mastered
- Linked to curriculum items, students, and lesson plans
- **Report cards** auto-generated from observations
- **Branded report cards** with school logo, colors, contact info
- **Print support** with print-optimized CSS

### 6. Smart Attendance
- Daily attendance recording per class
- Status options: Present, Absent, Late, Excused
- Bulk recording for entire class
- **Attendance history** with date filtering
- **Dashboard stat**: Today's attendance rate

### 7. Fees, Finance & Online Payments
- **Fee structures** by grade and term
- **Invoice generation** per student
- **Payment recording** (cash, card, bank transfer)
- **Paystack integration** — parents pay via card, bank transfer, USSD
- **Branded invoices** with school currency symbol
- **Stats dashboard**: Total revenue, pending, paid amounts

### 8. HR & Staff Management
- Staff profiles with position, salary, hire date
- **Create login accounts** for staff with custom email
- Leave request management (approve/reject)
- Role permission management API

### 9. Inventory Management
- Materials tracking with quantity, location, low stock threshold
- Checkout/return system
- Restock, edit, delete actions

### 10. Communication
- **Threaded messaging** with conversation support
- Recipient selection from school users
- **Read/unread tracking** with unread counts
- **Announcements** with class targeting
- Mark as read functionality

### 11. Gamification
- **Points system** — teachers award points for achievements
- **Badges** with custom criteria
- **Leaderboard** with weekly/monthly/termly rankings
- Student motivation and engagement tracking

### 12. AI Integration
- **AI Insights** — student performance analysis from observation data
- **AI Assistant** — chat interface for context-aware help
- Role-aware responses (admin sees different insights than teachers)
- Recommendations based on curriculum mastery levels

### 13. Offline-First & Sync
- **SyncStatus component** in sidebar — shows online/offline/pending state
- **Browser event listeners** for online/offline detection
- **Offline banner** with visual indicator
- **Pending sync queue** for offline operations
- Prisma `syncStatus` field on attendance records

### 14. Audit Logging
- **Every action logged** — who, what, when
- **Paginated audit log** with page controls
- Filtered by tenant for security
- Cannot be deleted (immutable)

### 15. Branded Documents
- Report cards use school logo, colors, name, motto, contact info
- Finance amounts use school currency symbol
- Print-optimized CSS for physical documents
- Branded footer on all generated documents

---

## 📡 API Documentation

### Authentication
```
POST   /api/v1/auth/register    — Register new tenant
POST   /api/v1/auth/login       — Login (returns access + refresh tokens)
POST   /api/v1/auth/refresh     — Refresh access token
POST   /api/v1/auth/logout      — Logout
```

### Core Resources
```
GET    /api/v1/students          — List students
POST   /api/v1/students          — Create student
PATCH  /api/v1/students/:id      — Update student
DELETE /api/v1/students/:id      — Delete student

GET    /api/v1/classes           — List classes
POST   /api/v1/classes           — Create class
PATCH  /api/v1/classes/:id       — Update class (assign teachers)
DELETE /api/v1/classes/:id       — Delete class

GET    /api/v1/attendance        — List attendance records
POST   /api/v1/attendance/bulk   — Bulk record attendance

GET    /api/v1/observations      — List observations
POST   /api/v1/observations      — Create observation
PATCH  /api/v1/observations/:id  — Update observation
DELETE /api/v1/observations/:id  — Delete observation
```

### Finance
```
GET    /api/v1/finance/fee-structures          — List fee structures
POST   /api/v1/finance/fee-structures          — Create fee structure
GET    /api/v1/finance/invoices                — List invoices
POST   /api/v1/finance/invoices                — Create invoice
POST   /api/v1/finance/payments                — Record payment
POST   /api/v1/finance/payments/initialize     — Initialize Paystack
GET    /api/v1/finance/payments/verify/:ref    — Verify payment
POST   /api/v1/finance/payments/webhook        — Paystack webhook
```

### Communication
```
GET    /api/v1/communication/messages            — List conversations
POST   /api/v1/communication/messages            — Send message
GET    /api/v1/communication/messages/:id        — Get thread
PATCH  /api/v1/communication/messages/:id/read   — Mark as read
GET    /api/v1/communication/announcements       — List announcements
POST   /api/v1/communication/announcements       — Create announcement
DELETE /api/v1/communication/announcements/:id   — Delete announcement
GET    /api/v1/communication/unread-counts       — Unread counts
```

### HR & Settings
```
GET    /api/v1/hr                 — List staff
POST   /api/v1/hr                 — Create staff
POST   /api/v1/hr/:id/create-account — Create staff login
GET    /api/v1/hr/meta/roles      — List roles
GET    /api/v1/settings           — Get settings
PUT    /api/v1/settings           — Update settings (40+ fields)
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Ammarbashirharuna/LMS-ERP.git
cd LMS-ERP

# 2. Install root dependencies
npm install

# 3. Install workspace dependencies
cd packages/backend && npm install && cd ../..
cd packages/frontend && npm install && cd ../..

# 4. Set up database
# Create a PostgreSQL database, then:
cd packages/backend
cp .env.example .env
# Edit .env with your DATABASE_URL

# 5. Run migrations and seed
npx prisma migrate dev
npx tsx prisma/seed.ts

# 6. Start development servers
# Terminal 1 - Backend
cd packages/backend && npx tsx src/index.ts

# Terminal 2 - Frontend
cd packages/frontend && npx vite
```

### Environment Variables

See `packages/backend/.env.example` for all required variables.

---

## 🤖 AI Integration

### AI Insights
- Analyzes student observation data to generate performance insights
- Identifies strengths and areas needing improvement
- Provides actionable recommendations for teachers
- Context-aware based on user role

### AI Assistant
- Interactive chat interface accessible from any page
- Role-aware: different responses for admin, teacher, parent
- Contextual help based on current page/feature
- Glassmorphism UI with smooth animations

---

## 📱 Offline-First Approach

1. **Detection**: Browser `online`/`offline` events monitored
2. **Visual Feedback**: Red banner when offline, sync status in sidebar
3. **Pending Queue**: Operations queued when offline
4. **Sync on Reconnect**: Automatic sync when connection restored
5. **Prisma SyncStatus**: `SYNCED`, `PENDING`, `CONFLICT` states on attendance records

---

## 🔐 RBAC Structure

| Permission | Admin | Teacher | Parent | Student |
|------------|-------|---------|--------|---------|
| students:read | ✅ | ✅ | ✅ | ❌ |
| students:write | ✅ | ❌ | ❌ | ❌ |
| attendance:read | ✅ | ✅ | ✅ | ❌ |
| attendance:write | ✅ | ✅ | ❌ | ❌ |
| observations:read | ✅ | ✅ | ✅ | ❌ |
| observations:write | ✅ | ✅ | ❌ | ❌ |
| finance:read | ✅ | ❌ | ✅ | ❌ |
| finance:write | ✅ | ❌ | ✅ | ❌ |
| hr:read | ✅ | ❌ | ❌ | ❌ |
| hr:write | ✅ | ❌ | ❌ | ❌ |
| messages:read | ✅ | ✅ | ✅ | ❌ |
| messages:write | ✅ | ✅ | ✅ | ❌ |
| announcements:read | ✅ | ✅ | ✅ | ✅ |
| settings:read | ✅ | ❌ | ❌ | ❌ |
| settings:write | ✅ | ❌ | ❌ | ❌ |
| audit:read | ✅ | ❌ | ❌ | ❌ |

---

## 📊 Assessment Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| UI/UX Design | ✅ | Modern glassmorphism, responsive, role-specific |
| Database Design | ✅ | 22 Prisma models, proper relations, indexes |
| Multi-Tenant RBAC | ✅ | JWT + permission middleware on every route |
| Curriculum & Lesson Plans | ✅ | CurriculumArea → CurriculumItem → LessonPlan |
| Gamification | ✅ | Points, badges, leaderboard |
| Observations | ✅ | Mastery levels, curriculum-linked |
| Student Profiles | ✅ | Full CRUD with class assignment |
| Attendance | ✅ | Bulk recording, history, offline support |
| Finance & Payments | ✅ | Invoices, Paystack integration, branded amounts |
| HR & Staff | ✅ | Staff CRUD, create login, leave requests |
| Inventory | ✅ | Materials, checkout, restock |
| Communication | ✅ | Threaded messaging, announcements |
| AI Insights | ✅ | Observation-based analytics |
| AI Assistant | ✅ | Context-aware chat interface |
| Offline-First | ✅ | Sync status, pending queue, online detection |
| Audit Logging | ✅ | Paginated, immutable, tenant-scoped |
| Documentation | ✅ | README, DEPLOYMENT, PRD docs |
| CI/CD | ✅ | GitHub Actions pipeline |
| Branded Documents | ✅ | Report cards, invoices with school branding |
| Settings | ✅ | 40+ fields across 7 tabs |

---

---

**Built with ❤️ for Montessori education**
