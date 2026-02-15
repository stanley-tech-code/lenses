# Baus Optical — Lenses Platform
## Complete Backend Build & Integration Guide

---

## What Was Built

This document covers everything added to the Lenses platform to make it production-ready for Baus Optical's 6+ branches.

---

## New Files Created

### Backend (API Routes)

| File | Purpose |
|------|---------|
| `src/app/api/auth/sign-in/route.ts` | Real login — bcrypt password verification + JWT |
| `src/app/api/auth/sign-up/route.ts` | User registration |
| `src/app/api/auth/me/route.ts` | Token verification + user info |
| `src/app/api/webhooks/pos/route.ts` | **Webhook receiver** — POS pushes events here |
| `src/app/api/customers/route.ts` | List/create customers (paginated, searchable) |
| `src/app/api/campaigns/route.ts` | List/create campaigns |
| `src/app/api/reminders/route.ts` | List/create reminders |
| `src/app/api/dashboard/stats/route.ts` | Real aggregated stats for overview page |
| `src/app/api/integrations/save/route.ts` | Save POS + SMS config per branch |
| `src/app/api/integrations/test-pos/route.ts` | Test POS API connection |
| `src/app/api/integrations/test-sms/route.ts` | Send a test SMS |

### Business Logic Library

| File | Purpose |
|------|---------|
| `src/lib/sms/client.ts` | SMS abstraction — Africa's Talking, Twilio, VeriSend |
| `src/lib/pos/integration.ts` | POS integration — webhook verification + event normalization + API polling |
| `src/lib/queue/automation-engine.ts` | **The brain** — processes POS events → finds template → sends SMS |
| `src/lib/auth/middleware.ts` | JWT verification helper used in every API route |
| `src/lib/auth/client.ts` | Frontend auth client (replaces the mock) |

### Database

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Complete multi-branch schema: User, Branch, PosConfig, Customer, Template, Campaign, Reminder, SmsLog, PosEvent |

### Frontend (Updated Pages)

| File | Purpose |
|------|---------|
| `src/app/dashboard/integrations/page.tsx` | **Fully wired** integrations page with real API calls |
| `src/app/dashboard/page.tsx` | Overview page that fetches real stats every 30s |

---

## Step 1 — Install New Dependencies

```bash
npm install bcryptjs jose dayjs
npm install --save-dev @types/bcryptjs
```

---

## Step 2 — Set Up the Database (Supabase)

1. Go to **supabase.com** and create a free project
2. Copy your connection string from: **Settings → Database → Connection string → URI**
3. Update your `.env` file:

```env
# .env

# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Auth
JWT_SECRET="generate-a-strong-64-char-secret-here"

# App URL (used in webhook URLs shown to the POS team)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Branch ID for single-branch deployments
NEXT_PUBLIC_BRANCH_ID="your-branch-uuid-here"
```

4. Change `prisma/schema.prisma` datasource:
```prisma
datasource db {
  provider = "postgresql"   # ← change from "sqlite"
  url      = env("DATABASE_URL")
}
```

5. Run the migration:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

6. Seed the first branch and admin user:
```bash
npx prisma studio  # Use the GUI to add your first Branch and User records
```

---

## Step 3 — Add the /api/auth/me Route

Create `src/app/api/auth/me/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, branch: { select: { id: true, name: true } } },
  });

  if (!user) return unauthorizedResponse();
  return NextResponse.json({ user });
}
```

---

## Step 4 — Replace the Auth Client

Replace the contents of `src/lib/auth/client.ts` with the new `baus-backend/src/lib/auth/client.ts` file provided.

This connects sign-in/sign-up to the real API instead of the hardcoded mock user.

---

## Step 5 — Wire Up the POS Integration

### Option A — Webhook (Recommended: POS pushes events to us)

Give the Baus Optical POS development team:
- **Webhook URL:** `https://yourdomain.com/api/webhooks/pos`
- **Header required:** `X-Branch-ID: <branchId>`
- **Signature header:** `X-Webhook-Signature: sha256=<hmac_sha256_of_body>`
- **HMAC Secret:** (generated per-branch when you save the integration settings)

The POS should POST a JSON body like:
```json
{
  "event_type": "sale_completed",
  "id": "unique-event-id-123",
  "customer": {
    "name": "John Kamau",
    "phone": "0712345678"
  },
  "order_id": "ORD-4521",
  "created_at": "2026-02-15T10:30:00Z"
}
```

Supported `event_type` values the webhook understands:
- `sale.completed` / `sale_completed` / `purchase.done` → **AFTER_PURCHASE**
- `visit.checkedout` / `visit_completed` / `patient.checked_out` → **AFTER_VISIT**
- `repair.created` / `repair.logged` → **REPAIR_LOGGED**
- `repair.completed` / `repair.done` → **REPAIR_COMPLETED**
- `order.ready` / `order.collected` / `order_ready` → **ORDER_COLLECTED**
- `followup.needed` → **FOLLOWUP_NEEDED**
- `exam.due` → **EYE_EXAM_DUE**
- `checkup.seasonal` → **SEASONAL_CHECKUP**

> **Update `src/lib/pos/integration.ts` → EVENT_TYPE_MAP** with whatever exact event names Baus Optical's POS actually sends.

### Option B — API Key (We poll the POS)

Set the POS Base URL and API Key in the Integrations page. The system will poll the POS `/events?since=<timestamp>` endpoint every 5 minutes.

> Both modes can run simultaneously. Webhooks give instant response; API polling acts as a safety net.

---

## Step 6 — Set Up the Reminder Scheduler

Reminders with a delay (e.g., "send 2 days after visit") are stored as pending Reminders and need a scheduler to fire them.

### Option A — Vercel Cron (if deployed on Vercel)

Create `src/app/api/cron/process-reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/queue/automation-engine';

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await processDueReminders();
  return NextResponse.json({ ok: true });
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "* * * * *"
    }
  ]
}
```

### Option B — External Cron (any hosting)

Call `POST /api/cron/process-reminders` every minute from a cron job, cron-job.org, or similar.

---

## Step 7 — SMS Template Variables

All templates support these variables that get replaced with real data when sending:

| Variable | Replaced With |
|----------|--------------|
| `{{customer_name}}` | Customer's full name from POS |
| `{{order_id}}` | Order/receipt number from POS event |
| `{{branch_name}}` | The branch name (e.g., "Baus Optical Westlands") |
| `{{appointment_date}}` | Formatted appointment date from POS event |
| `{{opt_out_keyword}}` | The opt-out keyword (default: STOP) |

**Example template message:**
```
Hi {{customer_name}}, your order #{{order_id}} is ready for collection at {{branch_name}}. 
Reply {{opt_out_keyword}} to unsubscribe.
```

---

## Multi-Branch Architecture

Each of the 6+ Baus Optical branches has its own:
- `Branch` record (name, location, timezone)
- `PosConfig` (separate API key, webhook secret, SMS provider config)
- Customers scoped to that branch
- SMS logs scoped to that branch

**User roles:**
- `SUPER_ADMIN` — sees all branches, all data
- `BRANCH_ADMIN` — sees only their branch
- `STAFF` — read-only + can send manual SMS

Branch admins log in and the system automatically scopes all API calls to their `branchId`.

---

## Event Flow Diagram

```
Baus POS Event (e.g. "sale_completed")
         │
         ├── Webhook → POST /api/webhooks/pos
         │                     │
         └── API Poll → GET POS /events
                               │
                    ┌──────────▼──────────┐
                    │  Normalize Event     │
                    │  Deduplicate         │
                    │  Store in PosEvent   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Find/Create         │
                    │  Customer in DB      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Check Opt-out       │
                    │  Find Active         │
                    │  Template for Event  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Render Template     │
                    │  (fill in variables) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Delay?              │
                    │  Yes → Create        │
                    │  Reminder (pending)  │
                    │  No → Send Now       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  SMS Provider        │
                    │  (AT / Twilio /      │
                    │   VeriSend)          │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Log to SmsLog       │
                    │  Update PosEvent     │
                    └─────────────────────┘
```

---

## Quick Checklist

- [ ] Install new dependencies (`bcryptjs`, `jose`)
- [ ] Set up Supabase PostgreSQL database
- [ ] Update `.env` with DATABASE_URL and JWT_SECRET
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Seed first Branch and SUPER_ADMIN User
- [ ] Replace `src/lib/auth/client.ts` with the real version
- [ ] Replace `src/app/dashboard/integrations/page.tsx` with the wired version
- [ ] Replace `src/app/dashboard/page.tsx` with the real-data version
- [ ] Add `/api/auth/me` route
- [ ] Share webhook URL + HMAC secret with Baus POS dev team
- [ ] Update `EVENT_TYPE_MAP` with actual Baus POS event names
- [ ] Set up reminder scheduler (Vercel cron or external)
- [ ] Configure SMS provider in the Integrations dashboard
- [ ] Send a test SMS to verify delivery
