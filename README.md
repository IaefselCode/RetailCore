# RetailCore — Multi-Store Sales Management System

A full-stack POS (Point of Sale) and retail management platform built with Next.js 16, designed for businesses with multiple shop locations. It supports role-based access for administrators and employees, real-time notifications, inventory management, and comprehensive analytics.

**Live Demo:** [retail-core-mu.vercel.app](https://retail-core-mu.vercel.app)

---

## Features

### Admin Dashboard
- **Multi-Store Overview** — monitor all shops, sales, and inventory from a single dashboard
- **Product Management** — create, edit, and deactivate products with image upload and crop
- **Employee Management** — add staff, assign to shops, manage roles and access
- **Inventory Control** — purchase stock, distribute between shops, track stock health (out/low/overstocked/healthy)
- **Sales Analytics** — revenue, profit, cost analysis with daily/weekly/monthly/yearly granularity
- **Sales History** — full transaction log with CSV export, void/refund support
- **System Settings** — configure currency (USD/EUR/GBP/CAD/TZS), date format, and security
- **Audit Trail** — authentication event logging with export and clear functionality
- **Notifications** — real-time in-app notifications with SSE push

### Employee Dashboard
- **Point of Sale** — record sales with cart, discount, tax, and multiple payment methods
- **Product Catalog** — browse assigned shop products (deactivated products visible but non-interactive)
- **Inventory View** — check stock levels for their assigned shop
- **Sales History** — view personal transaction history

### Authentication & Security
- **JWT-based authentication** with NextAuth v5
- **Role-based access control** (Admin / Employee)
- **Password policies** — real-time strength validation with Zod (8+ chars, uppercase, lowercase, number, symbol)
- **Password reset** — email-based via Resend with secure token
- **Deactivation guards** — deactivated users/shops are blocked at login and mid-session
- **Input sanitization** — all user inputs sanitized before processing

### Real-Time & Notifications
- **Server-Sent Events (SSE)** for real-time notification push
- **Polling fallback** — automatic 30s polling when SSE connection drops (Vercel-compatible)
- **Stock health alerts** — automatic notifications for out-of-stock, low-stock, and overstocked items
- **High-value sale alerts** — admin notified for sales ≥ 500,000 TZS

### Internationalization
- **English** and **Kiswahili** support via `next-intl`
- Fully translatable UI with JSON message files

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Authentication | NextAuth v5 (JWT strategy) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Email | Resend |
| File Storage | Supabase Storage (with local fallback) |
| Image Processing | Sharp (with graceful fallback on Vercel) |
| Deployment | Vercel (serverless) |
| i18n | next-intl |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** database (local or hosted — Supabase, Neon, Vercel Postgres, etc.)
- **Supabase** project (for file storage — optional for local dev)
- **Resend** API key (for password reset emails — optional for local dev)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd point-of-sales
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# Authentication
AUTH_SECRET="your-random-secret-here"   # Generate with: openssl rand -base64 32
AUTH_TRUST_HOST=true

# Email (Resend) — needed for password reset
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# File Storage — set to "local" for development without Supabase
STORAGE_PROVIDER="local"                 # or "supabase"

# Supabase (only required if STORAGE_PROVIDER=supabase)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJ..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### 3. Database Setup

```bash
# Push the schema to your database
npx prisma db push

# Seed with demo data (creates admin + sample shops, employees, products)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gmail.com` | `Admin123!` |
| Employee | `employee@test.com` | `Employee123!` |

> **Important:** Change these credentials before deploying to production.

---

## Project Structure

```
point-of-sales/
├── app/
│   ├── (auth)/              # Public auth pages (login, forgot-password, reset-password)
│   ├── admin/               # Admin dashboard routes
│   │   ├── analytics/       # Revenue & performance analytics
│   │   ├── audit/           # Authentication event logs
│   │   ├── dashboard/       # Main admin dashboard
│   │   ├── employees/       # Employee management + detail pages
│   │   ├── inventory/       # Stock management, movements, distribution, health
│   │   ├── notifications/   # Admin notifications
│   │   ├── products/        # Product catalog + detail/edit pages
│   │   ├── profile/         # Admin profile with photo upload
│   │   ├── sales/           # Sales overview + history
│   │   ├── settings/        # System settings (currency, date format, security)
│   │   ├── shops/           # Shop management + detail pages
│   │   └── users/           # User account management
│   ├── employee/            # Employee dashboard routes
│   │   ├── dashboard/       # Employee home dashboard
│   │   ├── inventory/       # Shop inventory view
│   │   ├── products/        # Product catalog (read-only)
│   │   ├── profile/         # Employee profile + edit
│   │   ├── record-sale/     # Point of sale interface
│   │   ├── sales-history/   # Personal sales history
│   │   └── settings/        # Employee settings (password change)
│   ├── api/                 # API routes
│   │   └── notifications/
│   │       └── stream/      # SSE notification endpoint
│   ├── privacy/             # Privacy Policy (public)
│   └── terms/               # Terms of Service (public)
├── components/
│   ├── admin/               # Admin-specific UI components
│   ├── employee/            # Employee-specific UI components
│   ├── shared/              # Shared components (sidebar, topbar, providers)
│   └── ui/                  # shadcn/ui base components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client singleton
│   ├── sanitize.ts          # Input sanitization
│   ├── password-policy.ts   # Password strength validation
│   ├── date-format.ts       # System date format utilities
│   ├── money.ts             # Currency formatting
│   ├── images-server.ts     # Server-side image upload (Supabase/local)
│   ├── images.ts            # Client-side image compression (canvas)
│   ├── audit-log.ts         # Audit event logging
│   ├── auth-log.ts          # Authentication event logging
│   ├── email.ts             # Resend email integration
│   ├── invoice.ts           # Invoice number generation
│   ├── rate-limit.ts        # In-memory rate limiting
│   └── use-notification-sse.ts  # SSE notification hook
├── messages/
│   ├── en.json              # English translations
│   └── sw.json              # Kiswahili translations
├── prisma/
│   └── schema.prisma        # Database schema (15 models)
├── scripts/                 # Database seed scripts
├── public/                  # Static assets
├── proxy.ts                 # Next.js middleware (auth + route protection)
└── next.config.ts           # Next.js configuration
```

---

## Database Schema

The system uses 15 PostgreSQL models via Prisma:

| Model | Purpose |
|-------|---------|
| `User` | User accounts (admin + employee) with auth credentials |
| `Shop` | Retail locations with address and status |
| `Employee` | Staff assignments linking users to shops |
| `Product` | Product catalog with SKU, pricing, categories |
| `Category` | Product categories |
| `Inventory` | Per-shop stock levels (quantity, min/max thresholds) |
| `Sale` | Sales transactions with invoice numbers and totals |
| `SaleItem` | Individual line items within a sale |
| `StockTransaction` | Inventory movement history (in/out/transfer) |
| `Notification` | In-app notifications for users |
| `NotificationPreference` | Per-user notification toggle settings |
| `AuthLog` | Authentication event audit trail |
| `PasswordResetToken` | Secure password reset tokens |
| `RefreshToken` | JWT refresh tokens |
| `SystemSetting` | Key-value system configuration |

---

## Key Features Deep Dive

### Currency Support

The system supports 5 currencies configured via System Settings:

| Code | Currency |
|------|----------|
| USD | US Dollar |
| EUR | Euro |
| GBP | British Pound |
| CAD | Canadian Dollar |
| TZS | Tanzanian Shilling |

All monetary displays throughout the app respect the configured currency.

### Product Image Handling

- **Client-side:** Images are compressed to WebP via canvas before upload (~30–90KB)
- **Server-side:** Optional Sharp compression as a backstop (gracefully skipped on Vercel)
- **Storage:** Supabase Storage in production, local filesystem in development
- **Crop:** Circular crop dialog for profile photos, rectangular for products

### Deactivation Logic

| Scenario | Behavior |
|----------|----------|
| Shop deactivated | Employees of that shop cannot log in; existing sessions force-redirected to login |
| Employee deactivated | Cannot log in; existing sessions force-redirected to login |
| Product deactivated | Visible in employee views (greyed out with badge) but cannot be sold or interacted with |

### Inventory Stock Health

Each product at each shop has min/max stock thresholds:

| Status | Condition |
|--------|-----------|
| Out of Stock | `quantity = 0` |
| Low Stock | `quantity ≤ minStock` |
| Overstocked | `quantity > maxStock` (when max > 0) |
| Healthy | All other cases |

Automatic notifications are sent to admins when stock health changes.

---

## Available Scripts

```bash
npm run dev              # Start development server with Turbopack
npm run build            # Build for production (prisma generate + next build)
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run prisma migrate dev
npm run db:deploy        # Run prisma migrate deploy (production)
npm run db:seed          # Seed database with demo data
npm run db:studio        # Open Prisma Studio
npm run db:health        # Check database health
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

**Environment variables to set in Vercel:**
- `DATABASE_URL`, `DIRECT_URL`
- `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `STORAGE_PROVIDER=supabase`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

> **Note:** Do NOT set `AUTH_URL` or `NEXTAUTH_URL` in Vercel — the app auto-detects the domain from request headers.

### Self-Hosted

```bash
npm run build
npm run start
```

The server runs on port 3000 by default. Set `PORT` env var to change.

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/*` | GET/POST | NextAuth authentication endpoints |
| `/api/notifications/stream` | GET | SSE notification stream (authenticated) |
| `/api/notifications/unread-count` | GET | Polling fallback for notification count |

All other data operations are handled via Next.js Server Actions (not REST API).

---

## License

Private — All rights reserved.
