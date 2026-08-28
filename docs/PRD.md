# Product Requirements Document (PRD)
# Montessori ERP & Learning Management System

**Version**: 2.0
**Date**: August 2026
**Project**: SKYELAX Full Stack Developer Assessment

---

## 1. Executive Summary

The Montessori ERP & LMS is a comprehensive, multi-tenant school management platform designed specifically for Montessori educational institutions. It provides end-to-end management of students, curriculum, attendance, observations, finances, HR, inventory, communication, and gamification — all within a modern, responsive web application.

### Key Differentiators
- **Montessori-specific**: Mastery-level tracking (Introduced → Practicing → Mastered) aligned with Montessori methodology
- **Multi-tenant**: Complete data isolation between schools
- **Offline-first**: Core functionality works without internet
- **AI-powered**: Insights and assistant for data-driven decisions
- **Branded**: School-customizable logos, colors, and document templates

---

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         React + Vite + Tailwind CSS              │
│    TanStack Query · React Router · Zustand       │
├─────────────────────────────────────────────────┤
│              Vite Dev Proxy / Nginx              │
├─────────────────────────────────────────────────┤
│                Backend API                       │
│         Express.js + TypeScript                  │
│   JWT Auth · RBAC · Zod Validation              │
├─────────────────────────────────────────────────┤
│              Prisma ORM                          │
│         Type-safe queries + Migrations           │
├─────────────────────────────────────────────────┤
│           PostgreSQL 16                          │
│      22 models · Multi-tenant scoping            │
└─────────────────────────────────────────────────┘
```

### 2.2 Monorepo Structure
- **Turborepo** for workspace management
- **Shared TypeScript configs**
- **Independent deployment** of frontend and backend

---

## 3. Modules & Features

### 3.1 Authentication & Authorization
| Feature | Status | Details |
|---------|--------|---------|
| Registration | ✅ | New tenant creation with admin account |
| Login | ✅ | Email + password with JWT tokens |
| Token Refresh | ✅ | Automatic refresh before expiry |
| RBAC | ✅ | Permission-based middleware on every route |
| Multi-Tenancy | ✅ | Tenant ID scoping on all queries |
| Password Hashing | ✅ | bcryptjs with salt rounds |
| Rate Limiting | ✅ | Auth: 10/15min, API: 500/15min |

### 3.2 Student Management
| Feature | Status | Details |
|---------|--------|---------|
| Student Profiles | ✅ | Name, DOB, gender, class, enrollment |
| CRUD Operations | ✅ | Create, read, update, delete |
| Class Assignment | ✅ | Assign students to classrooms |
| Search | ✅ | Filter by name |
| Responsive Views | ✅ | Desktop table + mobile cards |
| Confirmation Modals | ✅ | For all destructive actions |

### 3.3 Montessori Curriculum
| Feature | Status | Details |
|---------|--------|---------|
| Curriculum Areas | ✅ | Practical Life, Sensorial, Language, Math, Cultural |
| Curriculum Items | ✅ | Linked to areas with age bands |
| Lesson Plans | ✅ | Teacher-created, linked to curriculum |
| Student Progress | ✅ | Per-area tracking with mastery levels |

### 3.4 Observation & Progress Tracking
| Feature | Status | Details |
|---------|--------|---------|
| Record Observations | ✅ | Note + mastery level + student + curriculum item |
| Mastery Levels | ✅ | Introduced, Practicing, Mastered |
| Branded Report Cards | ✅ | School logo, colors, contact info |
| Print Support | ✅ | Print-optimized CSS |
| Progress Analytics | ✅ | Per-area mastery percentages |

### 3.5 Attendance
| Feature | Status | Details |
|---------|--------|---------|
| Daily Recording | ✅ | Per class, per date |
| Bulk Recording | ✅ | Mark entire class at once |
| Status Options | ✅ | Present, Absent, Late, Excused |
| History | ✅ | View past attendance records |
| Dashboard Stat | ✅ | Today's attendance rate |

### 3.6 Finance & Payments
| Feature | Status | Details |
|---------|--------|---------|
| Fee Structures | ✅ | Grade + term based pricing |
| Invoice Generation | ✅ | Per student with due dates |
| Payment Recording | ✅ | Cash, card, bank transfer |
| Paystack Integration | ✅ | Online payment via card/bank/USSD |
| Currency Support | ✅ | 8 currencies (NGN, USD, GBP, EUR, etc.) |
| Branded Invoices | ✅ | School currency symbol and details |
| Stats Dashboard | ✅ | Revenue, pending, paid totals |

### 3.7 HR & Staff
| Feature | Status | Details |
|---------|--------|---------|
| Staff Profiles | ✅ | Name, position, salary, hire date |
| Create Login | ✅ | Admin creates teacher accounts with email |
| Leave Requests | ✅ | Request + approve/reject workflow |
| Role Management | ✅ | View and update role permissions |

### 3.8 Inventory
| Feature | Status | Details |
|---------|--------|---------|
| Materials Tracking | ✅ | Name, quantity, location, threshold |
| Checkout System | ✅ | Track material usage |
| Restock | ✅ | Restock materials |
| Edit/Delete | ✅ | Full CRUD with confirmation |

### 3.9 Communication
| Feature | Status | Details |
|---------|--------|---------|
| Threaded Messaging | ✅ | Root messages + replies |
| Recipient Selection | ✅ | Choose from school users |
| Read Tracking | ✅ | Unread counts per user |
| Announcements | ✅ | School-wide or class-targeted |
| Mark as Read | ✅ | Per message and announcement |

### 3.10 Gamification
| Feature | Status | Details |
|---------|--------|---------|
| Points System | ✅ | Teachers award points |
| Badges | ✅ | Custom criteria-based badges |
| Leaderboard | ✅ | Weekly/monthly/termly rankings |
| Student Motivation | ✅ | Visual rankings and achievements |

### 3.11 AI Integration
| Feature | Status | Details |
|---------|--------|---------|
| AI Insights | ✅ | Student performance analysis |
| AI Assistant | ✅ | Context-aware chat interface |
| Role-Aware | ✅ | Different insights per role |
| Data-Driven | ✅ | Based on observation data |

### 3.12 Offline-First
| Feature | Status | Details |
|---------|--------|---------|
| Online Detection | ✅ | Browser online/offline events |
| Visual Feedback | ✅ | Offline banner + sync status |
| Pending Queue | ✅ | Queue operations when offline |
| Auto-Sync | ✅ | Sync when connection restored |

### 3.13 Audit Logging
| Feature | Status | Details |
|---------|--------|---------|
| Action Logging | ✅ | Who, what, when, where |
| Paginated View | ✅ | Page controls with total count |
| Tenant-Scoped | ✅ | Each school sees only their logs |
| Immutable | ✅ | Logs cannot be deleted |

### 3.14 School Settings
| Feature | Status | Details |
|---------|--------|---------|
| 7 Settings Tabs | ✅ | Profile, Academic, Branding, Billing, Notifications, Security, System |
| 40+ Fields | ✅ | All stored in tenant JSON settings |
| Live Color Preview | ✅ | Real-time branding preview |
| Multi-Language | ✅ | 6 languages supported |
| Multi-Currency | ✅ | 8 currencies with auto-symbol |

---

## 4. Database Schema

### 4.1 Models (22 total)

| Model | Fields | Purpose |
|-------|--------|---------|
| Tenant | 6 | Multi-tenant root |
| User | 9 | Authentication |
| Role | 4 | Authorization |
| Permission | 4 | Fine-grained access |
| Student | 8 | Student profiles |
| ClassRoom | 5 | Class management |
| Staff | 11 | HR management |
| LeaveRequest | 8 | Leave workflow |
| Observation | 9 | Montessori observations |
| CurriculumArea | 3 | Curriculum structure |
| CurriculumItem | 6 | Curriculum content |
| LessonPlan | 8 | Teacher planning |
| Attendance | 8 | Daily tracking |
| FeeStructure | 5 | Fee configuration |
| Invoice | 7 | Billing |
| Payment | 6 | Payment records |
| Material | 6 | Inventory items |
| MaterialCheckout | 7 | Checkout tracking |
| Message | 6 | Messaging |
| MessageParticipant | 6 | Message tracking |
| Announcement | 7 | School announcements |
| AnnouncementParticipant | 6 | Announcement tracking |
| Badge | 6 | Gamification |
| BadgeAward | 6 | Badge assignments |
| Point | 6 | Points tracking |
| LeaderboardEntry | 6 | Rankings |
| AuditLog | 6 | Security logging |

### 4.2 Key Relationships
- All models scoped by `tenantId` for multi-tenancy
- Self-referencing `Message` for threaded conversations
- `Observation` links Student, Teacher, CurriculumItem, and LessonPlan
- `Invoice` links Student and optional FeeStructure
- `MessageParticipant` enables read/unread tracking per user

---

## 5. API Design

### 5.1 Conventions
- RESTful endpoints under `/api/v1/`
- JWT Bearer token authentication
- Zod schema validation on all inputs
- Consistent error response format: `{ error: string }`
- Consistent success response format: `{ data: T }` or `{ data: T[], total, page, pages }`

### 5.2 Rate Limiting
| Scope | Limit | Window |
|-------|-------|--------|
| Auth endpoints | 10 requests | 15 minutes |
| API endpoints | 500 requests | 15 minutes |

### 5.3 Error Handling
- Global Express error handler with `headersSent` check
- `unhandledRejection` and `uncaughtException` handlers prevent crashes
- All route handlers wrapped in try-catch
- Prisma connection pool limits to prevent exhaustion

---

## 6. UI/UX Design

### 6.1 Design System
- **Colors**: Warm Montessori palette (orange primary, amber accent)
- **Typography**: Inter font family with system fallbacks
- **Spacing**: Consistent 4px grid system
- **Border radius**: 12px (surface), 8px (buttons), 20px (modals)
- **Shadows**: Subtle, layered shadows for depth

### 6.2 Animations & Transitions
- **Page enter**: Fade + slide up (0.35s cubic-bezier)
- **Stagger-in**: Cards appear sequentially (50ms delay)
- **Card hover**: Lift + shadow on hover
- **Progress bars**: Animate from 0% to value
- **Modals**: Scale + fade entrance
- **Glassmorphism**: Sidebar, AI button, overlays

### 6.3 Responsive Design
- **Mobile**: Single column, card layouts, touch-friendly
- **Tablet**: 2-column grids, side-by-side elements
- **Desktop**: Full tables, 4-column stat grids, sidebars
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`

---

## 7. Deployment

### 7.1 Render Configuration
- **Backend**: Node.js web service with build-time Prisma migration
- **Frontend**: Static site with SPA rewrite rules
- **Database**: Render-managed PostgreSQL 16

### 7.2 CI/CD Pipeline
1. **Lint & Typecheck** — TypeScript compilation check
2. **Test** — Jest with test database
3. **Build** — Frontend production build
4. **Deploy** — Auto-deploy on main branch push

### 7.3 Prisma Migration Strategy
- Migrations run during Render build step (not post-deploy)
- `npx prisma migrate deploy` in build command
- No shell access required post-deployment

---

## 8. Security

| Measure | Implementation |
|---------|----------------|
| Password hashing | bcryptjs with salt |
| JWT tokens | Short-lived access + long refresh |
| RBAC | Permission middleware on every route |
| Rate limiting | Per-route limits |
| CORS | Configurable allowed origins |
| Input validation | Zod schemas on all endpoints |
| SQL injection | Prevented by Prisma ORM |
| XSS | React auto-escaping + CSP headers |
| Audit logging | All actions logged immutably |
| Multi-tenancy | Tenant ID scoping on all queries |

---

## 9. Additional / Unique Features (20 Marks)

### 9.1 Branded Documents
Report cards and invoices dynamically use school branding from settings (logo, colors, name, contact info).

### 9.2 Comprehensive School Settings
40+ configurable fields across 7 tabs — far beyond basic settings. Includes school type, registration number, academic weeks per term, timezone, bank details, and more.

### 9.3 Parent Online Payments
Paystack integration allows parents to pay school fees via card, bank transfer, or USSD directly from the platform.

### 9.4 Glassmorphism UI
Modern frosted glass effects on sidebar, modals, and overlays for a premium feel.

### 9.5 Confirmation Modals
All destructive actions use styled confirmation modals instead of browser `confirm()` dialogs.

### 9.6 Toast Notifications
Non-blocking success/error notifications replace `alert()` calls throughout the app.

---

## 10. Future Enhancements

- Email notifications via Resend API
- SMS notifications
- PDF export for report cards
- Bulk student import (CSV)
- Parent-teacher video calls
- Mobile app (React Native)
- Two-factor authentication
- Multi-language report cards
