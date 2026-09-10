# Technical Documentation: Zoho Jobs → /provide-support Integration

> **Purpose:** This document is a complete technical reference for how job listings are pulled from Zoho CRM Deals and displayed on the `/provide-support` page of the Remonta website. Use this to instruct AI agents, onboard developers, or debug the pipeline.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Environment Variables & Credentials](#2-environment-variables--credentials)
3. [Zoho CRM Configuration](#3-zoho-crm-configuration)
4. [Core Library: `src/lib/zoho.ts`](#4-core-library-srclibzohots)
5. [Step-by-Step Sync Pipeline](#5-step-by-step-sync-pipeline)
6. [API Endpoints](#6-api-endpoints)
7. [Database Schema: Job Model](#7-database-schema-job-model)
8. [Frontend: JobsSection Component](#8-frontend-jobssection-component)
9. [Cron Schedule](#9-cron-schedule)
10. [Full Architecture Diagram](#10-full-architecture-diagram)
11. [All Source Files Referenced](#11-all-source-files-referenced)

---

## 1. System Overview

Jobs on the `/provide-support` page are **not hardcoded**. They are pulled live from Zoho CRM Deals, stored in a PostgreSQL database (via Prisma), and served to the frontend through a public REST API.

**The flow in plain English:**
1. A coordinator creates a Deal in Zoho CRM and sets its Stage to `"Recruitment End"`.
2. A scheduled cron job (or manual trigger) calls the Zoho API, fetches all Deals in that stage, and upserts them into the database.
3. The `/provide-support` page renders a `JobsSection` component that fetches active jobs from the database via `GET /api/jobs`.
4. Jobs are displayed as cards in a Swiper carousel.

---

## 2. Environment Variables & Credentials

All secrets are stored in `.env.local` (never committed to git). These must be present in Vercel's environment settings for production.

```env
# ── Zoho OAuth2 Credentials ──────────────────────────────────────────────────
ZOHO_CLIENT_ID=1000.UDZLWOE5QTW3RTXNT7RCN53PH61GYJ
ZOHO_CLIENT_SECRET=c91cc4b79fb8766b048b1624a531a0808ac0b60f91
ZOHO_REFRESH_TOKEN=1000.29624d3681e88486e0e1472e34f03462.5e6f3c60ad1c0fa1287abd3dbfbe7e85
ZOHO_REDIRECT_URI=https://www.remontaservices.com.au/api/zoho/callback
ZOHO_SCOPE=ZohoCRM.modules.ALL
ZOHO_ACCESS_TYPE=offline

# ── Zoho API Endpoints (Australia region) ────────────────────────────────────
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com.au
ZOHO_CRM_API_URL=https://www.zohoapis.com.au/crm/v2

# ── Internal API Security ─────────────────────────────────────────────────────
SYNC_API_SECRET=3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785
CRON_SECRET=c056ad70136b352a305d7bdc908ed5aa642c3236e239856c8d40e7f2236b564b

# ── App Base URL ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=https://www.remontaservices.com.au
```

### Variable Descriptions

| Variable | Purpose |
|---|---|
| `ZOHO_CLIENT_ID` | OAuth2 app Client ID from Zoho API Console |
| `ZOHO_CLIENT_SECRET` | OAuth2 app Client Secret from Zoho API Console |
| `ZOHO_REFRESH_TOKEN` | Long-lived refresh token used to get new access tokens automatically |
| `ZOHO_ACCOUNTS_URL` | Zoho OAuth token endpoint (Australian data center) |
| `ZOHO_CRM_API_URL` | Zoho CRM REST API base URL (Australian data center) |
| `SYNC_API_SECRET` | Secret required in `x-api-secret` header to call `/api/sync-jobs` or `/api/refresh-jobs` |
| `CRON_SECRET` | Secret Vercel injects into cron requests as `Authorization: Bearer <secret>` |

---

## 3. Zoho CRM Configuration

### Module Used
- **Module:** `Leads`
- **Stage Filter:** `"Recruitment End"` — only Deals in this stage are treated as active job listings

### Key Zoho Deal Fields Mapped to DB

| Zoho Field | Database Column | Description |
|---|---|---|
| `id` | `zohoId` | Unique Zoho Deal ID (primary key for upsert) |
| `Lead_Name` | `dealName` | Internal deal name |
| `Job_Title` | `title` | Public job title |
| `Description` | `description` | Job description shown on the card |
| `Stage` | `stage` | Should always be `"Recruitment End"` |
| `Suburbs` | `suburbs` | Location suburb |
| `State` | `state` | Location state (e.g., QLD, NSW) |
| `Service_Availed` | `serviceAvailed` | Type of support (e.g., "Support Work") |
| `Service_Requirements` | `serviceRequirements` | Worker requirements text |
| `Disabilities` | `disabilities` | Client's disabilities |
| `Behavioural_Concerns` | `behaviouralConcerns` | Any behavioural concerns |
| `Cultural_Considerations` | `culturalConsiderations` | Cultural requirements |
| `Language` | `language` | Language requirements |
| `Religion` | `religion` | Religion preference |
| `Age` | `age` | Client age (stored as string) |
| `Gender` | `gender` | Gender preference |
| `Hobbies` | `hobbies` | Client's hobbies |
| `Client_Name.name` | `clientName` | Lookup to client contact name |
| `Client_Name.id` | `clientZohoId` | Lookup to client contact ID |
| `Relationship_to_Participant` | `relationshipToParticipant` | e.g., "SC" (Support Coordinator) |
| `Owner.name` | `ownerName` | Deal owner name |
| `Owner.email` | `ownerEmail` | Deal owner email |
| `Owner.id` | `ownerZohoId` | Deal owner Zoho ID |
| `Created_Time` | `postedAt` | When job was created in Zoho |
| `Required_More_Worker` | `requiredMoreWorker` | Boolean flag |
| `Another_Contractor_Needed` | `anotherContractorNeeded` | Boolean flag |

---

## 4. Core Library: `src/lib/zoho.ts`

This file exports a singleton `ZohoService` class that handles all Zoho CRM API interactions, including automatic OAuth2 token refresh.

### Token Management

```typescript
// File: src/lib/zoho.ts

class ZohoService {
  private accessToken: string | null = null
  private tokenExpiryTime: number | null = null

  private async getAccessToken(): Promise<string> {
    // Returns cached token if still valid
    if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
      return this.accessToken
    }

    // Refreshes using refresh_token grant
    const params = new URLSearchParams({
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
    })

    const response = await fetch(`${this.accountsUrl}/oauth/v2/token?${params}`, {
      method: 'POST',
    })

    const data: ZohoTokenResponse = await response.json()
    this.accessToken = data.access_token
    // Token expires 5 minutes early for safety
    this.tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000

    return this.accessToken
  }
}
```

**OAuth2 Token URL:**
```
POST https://accounts.zoho.com.au/oauth/v2/token
  ?refresh_token=<ZOHO_REFRESH_TOKEN>
  &client_id=<ZOHO_CLIENT_ID>
  &client_secret=<ZOHO_CLIENT_SECRET>
  &grant_type=refresh_token
```

### Method Used for Jobs: `getDealsByStage()`

```typescript
// File: src/lib/zoho.ts

async getDealsByStage(stage: string): Promise<ZohoDeal[]> {
  const token = await this.getAccessToken()
  const allDeals: ZohoDeal[] = []
  let page = 1
  let moreRecords = true

  const criteria = encodeURIComponent(`(Stage:equals:${stage})`)

  while (moreRecords) {
    const url = `${this.apiUrl}/Deals/search?criteria=${criteria}&page=${page}&per_page=200`

    const response = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })

    if (response.status === 204) return [] // No records found

    const data: ZohoDealsResponse = await response.json()
    if (data.data) allDeals.push(...data.data)

    moreRecords = data.info?.more_records || false
    page++
  }

  return allDeals
}
```

**Zoho API URL for Jobs:**
```
GET https://www.zohoapis.com.au/crm/v2/Deals/search
  ?criteria=(Stage:equals:Recruitment End)
  &page=1
  &per_page=200
Authorization: Zoho-oauthtoken <access_token>
```

### Singleton Export

```typescript
// File: src/lib/zoho.ts (bottom of file)
export const zohoService = new ZohoService()
export type { ZohoContact, ZohoDeal }
```

---

## 5. Step-by-Step Sync Pipeline

### Step 1 — Trigger (three ways)

| Trigger | Method | Endpoint | Auth |
|---|---|---|---|
| Automatic (daily) | `GET` | `/api/cron/sync-jobs` | `Authorization: Bearer <CRON_SECRET>` (Vercel-injected) |
| Manual by admin | `POST` | `/api/refresh-jobs` | `x-api-secret: <SYNC_API_SECRET>` |
| Direct call | `POST` | `/api/sync-jobs` | `x-api-secret: <SYNC_API_SECRET>` |

---

### Step 2 — Cron Calls Sync (`/api/cron/sync-jobs`)

```typescript
// File: src/app/api/cron/sync-jobs/route.ts

export async function GET(request: NextRequest) {
  // 1. Vercel injects Authorization: Bearer <CRON_SECRET> automatically
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Internally calls /api/sync-jobs with the SYNC_API_SECRET
  const response = await fetch(`${baseUrl}/api/sync-jobs`, {
    method: 'POST',
    headers: {
      'x-api-secret': process.env.SYNC_API_SECRET!,
      'Content-Type': 'application/json'
    }
  })
}
```

---

### Step 3 — Sync Jobs Core Logic (`/api/sync-jobs`)

```typescript
// File: src/app/api/sync-jobs/route.ts

export async function POST(request: NextRequest) {
  // 1. Verify API secret
  const apiSecret = request.headers.get('x-api-secret')
  if (apiSecret !== process.env.SYNC_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Prevent concurrent syncs with in-memory mutex
  if (isSyncing) {
    return NextResponse.json({ error: 'Sync already in progress' }, { status: 409 })
  }
  isSyncing = true

  // 3. Fetch all Deals with Stage = "Recruitment End" from Zoho
  const matchingDeals = await zohoService.getDealsByStage('Recruitment End')

  // 4. For each deal, upsert into the Job table
  for (const deal of matchingDeals) {
    const jobData = {
      zohoId: deal.id,
      dealName: deal.Deal_Name || 'Untitled Job',
      title: deal.Job_Title || null,
      description: deal.Description || null,
      stage: deal.Stage || 'Recruitment End',
      suburbs: deal.Suburbs || null,
      state: deal.State || null,
      serviceAvailed: deal.Service_Availed || null,
      serviceRequirements: deal.Service_Requirements || null,
      disabilities: deal.Disabilities || null,
      behaviouralConcerns: deal.Behavioural_Concerns || null,
      culturalConsiderations: deal.Cultural_Considerations || null,
      language: deal.Language || null,
      religion: deal.Religion || null,
      age: deal.Age ? String(deal.Age) : null,
      gender: deal.Gender || null,
      hobbies: deal.Hobbies || null,
      clientName: deal.Client_Name?.name || null,
      clientZohoId: deal.Client_Name?.id || null,
      relationshipToParticipant: deal.Relationship_to_Participant || null,
      ownerName: deal.Owner?.name || null,
      ownerEmail: deal.Owner?.email || null,
      ownerZohoId: deal.Owner?.id || null,
      postedAt: deal.Created_Time ? new Date(deal.Created_Time) : null,
      active: true,
      requiredMoreWorker: parseBoolean(deal.Required_More_Worker),
      anotherContractorNeeded: parseBoolean(deal.Another_Contractor_Needed),
      lastSyncedAt: syncTimestamp,
    }

    await prisma.job.upsert({
      where: { zohoId: deal.id },
      update: jobData,
      create: jobData,
    })
  }

  // 5. Deactivate jobs no longer in "Recruitment End" stage
  await prisma.job.updateMany({
    where: {
      active: true,
      zohoId: { notIn: zohoIds }
    },
    data: { active: false, lastSyncedAt: syncTimestamp }
  })

  isSyncing = false
}
```

---

### Step 4 — Frontend Fetches Jobs (`GET /api/jobs`)

```typescript
// File: src/app/api/jobs/route.ts

export async function GET() {
  const jobs = await prisma.job.findMany({
    where: { active: true },
    orderBy: { postedAt: 'desc' },
    select: {
      id: true, zohoId: true, dealName: true, title: true,
      description: true, stage: true, suburbs: true, state: true,
      serviceAvailed: true, serviceRequirements: true,
      disabilities: true, behaviouralConcerns: true,
      culturalConsiderations: true, language: true, religion: true,
      age: true, gender: true, hobbies: true,
      postedAt: true, active: true, createdAt: true,
    }
  })

  return NextResponse.json({ success: true, jobs, count: jobs.length })
}
```

**No authentication required** — this is a public read-only endpoint.

---

### Step 5 — JobsSection Renders on `/provide-support`

```typescript
// File: src/components/sections/JobsSection.tsx

const { data: jobs } = useSWR<Job[]>('/api/jobs', fetcher, {
  dedupingInterval: 300000,   // 5-minute client-side cache
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 0,         // No auto-polling
})
```

Each job card displays:
- **Title:** `{serviceAvailed} - {suburbs}, {state}`
- **Location:** `{suburbs}, {state}`
- **Posted Date:** formatted from `postedAt` or `createdAt`
- **Description:** `{description}`
- **Requirements:** `{serviceRequirements}`
- **Apply Button** → links to `/registration/worker`

---

## 6. API Endpoints

### `POST /api/sync-jobs` — Core sync endpoint

```
POST https://www.remontaservices.com.au/api/sync-jobs
Headers:
  x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785
  Content-Type: application/json
```

**Success response:**
```json
{
  "success": true,
  "message": "Jobs synced successfully",
  "stats": {
    "created": 5,
    "updated": 2,
    "deactivated": 1,
    "errors": 0
  },
  "syncTime": "2026-02-19T00:00:00.000Z",
  "duration": "1234ms",
  "totalJobs": 7
}
```

**Error responses:**
- `401` — Wrong or missing `x-api-secret`
- `409` — Sync already in progress
- `502` — Zoho API unavailable
- `500` — Database error

---

### `GET /api/sync-jobs` — Check sync status

```
GET https://www.remontaservices.com.au/api/sync-jobs
```

No authentication required. Returns:
```json
{
  "isSyncing": false,
  "lastSyncTime": "2026-02-19T23:30:00.000Z",
  "message": "Last sync completed at 2026-02-19T23:30:00.000Z"
}
```

---

### `POST /api/refresh-jobs` — Manual admin trigger

```
POST https://www.remontaservices.com.au/api/refresh-jobs
Headers:
  x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785
```

Internally calls `POST /api/sync-jobs`. Returns same response as sync-jobs with `"triggeredBy": "manual"`.

**curl example:**
```bash
curl -X POST https://www.remontaservices.com.au/api/refresh-jobs \
  -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"
```

---

### `GET /api/cron/sync-jobs` — Vercel cron trigger

```
GET https://www.remontaservices.com.au/api/cron/sync-jobs
Headers:
  Authorization: Bearer c056ad70136b352a305d7bdc908ed5aa642c3236e239856c8d40e7f2236b564b
```

Called automatically by Vercel. Do not call manually in production (Vercel manages the `Authorization` header).

---

### `GET /api/jobs` — Public job listings

```
GET https://www.remontaservices.com.au/api/jobs
```

No authentication. Returns all active jobs from the database:
```json
{
  "success": true,
  "count": 7,
  "jobs": [
    {
      "id": "...",
      "zohoId": "87697000012345678",
      "dealName": "Job - John Smith",
      "title": null,
      "description": "Looking for a support worker...",
      "stage": "Recruitment End",
      "suburbs": "Brisbane",
      "state": "QLD",
      "serviceAvailed": "Support Work",
      "serviceRequirements": "Female worker preferred",
      "disabilities": "Autism",
      "behaviouralConcerns": null,
      "culturalConsiderations": null,
      "language": null,
      "religion": null,
      "age": "25",
      "gender": "Female",
      "hobbies": null,
      "postedAt": "2026-02-01T00:00:00.000Z",
      "active": true,
      "createdAt": "2026-02-01T00:00:00.000Z"
    }
  ],
  "lastUpdated": "2026-02-19T10:00:00.000Z"
}
```

---

## 7. Database Schema: Job Model

```prisma
// File: prisma/schema.prisma

model Job {
  id                        String    @id @default(cuid())
  zohoId                    String    @unique          // Zoho Deal ID — used as upsert key

  // Basic Job Information
  dealName                  String                     // Deal_Name from Zoho
  title                     String?                    // Job_Title (custom field)
  description               String?                    // Description from Zoho
  stage                     String                     // "Recruitment End"

  // Location
  suburbs                   String?                    // Suburbs from Zoho
  state                     String?                    // State (QLD, NSW, etc.)

  // Service
  serviceAvailed            String?                    // e.g., "Support Work"
  serviceRequirements       String?                    // Worker requirements

  // Requirements
  disabilities              String?
  behaviouralConcerns       String?
  culturalConsiderations    String?
  language                  String?
  religion                  String?

  // Personal Preferences
  age                       String?                    // Stored as string (can be range)
  gender                    String?
  hobbies                   String?

  // Client Information
  clientName                String?
  clientZohoId              String?
  relationshipToParticipant String?

  // Owner Information
  ownerName                 String?
  ownerEmail                String?
  ownerZohoId               String?

  // Dates
  postedAt                  DateTime?                  // Created_Time from Zoho

  // Status
  active                    Boolean   @default(true)   // false = hidden from frontend
  requiredMoreWorker        Boolean?
  anotherContractorNeeded   Boolean?

  // System
  lastSyncedAt              DateTime?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
}
```

**Upsert key:** `zohoId` (unique) — ensures no duplicate jobs, and updates existing records on re-sync.

---

## 8. Frontend: JobsSection Component

**File:** `src/components/sections/JobsSection.tsx`
**Used on:** `src/app/provide-support/page.tsx`

```typescript
// SWR hook — fetches from /api/jobs with 5-minute cache
const { data: jobs, error, isLoading } = useSWR<Job[]>('/api/jobs', fetcher, {
  dedupingInterval: 300000,    // Don't re-fetch within 5 minutes
  revalidateOnFocus: true,     // Re-fetch when tab regains focus
  revalidateOnReconnect: true, // Re-fetch when internet reconnects
  refreshInterval: 0,          // No auto-polling
})
```

**Card rendering logic:**
```typescript
// Title shown to user
const displayTitle = `${job.serviceAvailed || 'Support Work'} - ${location}`

// Location string
const location = [job.suburbs, job.state].filter(Boolean).join(', ') || 'Remote'

// Date shown
const postedDate = job.postedAt
  ? new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
```

**Apply button** links to: `https://app.remontaservices.com.au/registration/worker`

---

## 9. Cron Schedule

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-jobs",
      "schedule": "30 23 * * *"
    }
  ]
}
```

**Schedule:** `30 23 * * *` = Every day at **11:30 PM UTC** (9:30 AM AEST next day).

Vercel automatically adds `Authorization: Bearer <CRON_SECRET>` to all cron requests.

---

## 10. Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZOHO CRM                                 │
│                                                                 │
│  Deals Module                                                   │
│  ├── Stage: "Recruitment End"  ← ONLY these are synced          │
│  │   ├── Deal fields: Job_Title, Description, Suburbs, State,   │
│  │   │   Service_Availed, Service_Requirements, etc.            │
│  │   └── Owner, Client_Name (lookup fields)                     │
│  └── Other stages are ignored / deactivated in DB               │
└────────────────────────────┬────────────────────────────────────┘
                             │ Zoho API (OAuth2)
                             │ GET /crm/v2/Deals/search
                             │ ?criteria=(Stage:equals:Recruitment End)
                             │ Authorization: Zoho-oauthtoken <access_token>
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ src/lib/zoho.ts — ZohoService singleton                 │   │
│  │  • Manages OAuth2 token refresh automatically           │   │
│  │  • getDealsByStage("Recruitment End")                   │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  Trigger Options:                                               │
│  ┌──────────────┐  ┌──────────────────────┐                    │
│  │ Vercel Cron  │  │ Manual Admin Trigger  │                    │
│  │ 11:30 PM UTC │  │ POST /api/refresh-jobs│                    │
│  │ GET          │  │ x-api-secret required │                    │
│  │ /api/cron/   │  └──────────┬───────────┘                    │
│  │ sync-jobs    │             │                                 │
│  └──────┬───────┘             │                                 │
│         └──────────┬──────────┘                                 │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ POST /api/sync-jobs                                     │   │
│  │  1. Verify x-api-secret header                          │   │
│  │  2. Acquire in-memory mutex lock (prevent double sync)  │   │
│  │  3. Call zohoService.getDealsByStage("Recruitment End") │   │
│  │  4. Upsert each deal into Job table (by zohoId)         │   │
│  │  5. Deactivate jobs no longer in "Recruitment End"      │   │
│  │  6. Release lock                                        │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ Prisma ORM                        │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PostgreSQL Database                                     │   │
│  │  Job table                                              │   │
│  │  ├── zohoId (unique) — upsert key                       │   │
│  │  ├── active = true  ← visible on site                   │   │
│  │  └── active = false ← hidden (no longer in Zoho stage)  │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ GET /api/jobs (PUBLIC)                                  │   │
│  │  • No authentication required                           │   │
│  │  • Returns only active: true jobs                       │   │
│  │  • Ordered by postedAt DESC                             │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ /provide-support page                                   │   │
│  │  └── <JobsSection /> component                          │   │
│  │       • SWR fetches /api/jobs                           │   │
│  │       • 5-minute client-side cache                      │   │
│  │       • Renders Swiper carousel of job cards            │   │
│  │       • Apply button → /registration/worker             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. All Source Files Referenced

| File | Role |
|---|---|
| `src/lib/zoho.ts` | ZohoService class — all Zoho API calls, token refresh |
| `src/app/api/sync-jobs/route.ts` | Core sync logic — fetches from Zoho, upserts to DB |
| `src/app/api/cron/sync-jobs/route.ts` | Vercel cron entry point — calls `/api/sync-jobs` |
| `src/app/api/refresh-jobs/route.ts` | Manual admin trigger — calls `/api/sync-jobs` |
| `src/app/api/jobs/route.ts` | Public endpoint — serves active jobs to frontend |
| `src/components/sections/JobsSection.tsx` | Frontend component — renders job cards via SWR |
| `src/app/provide-support/page.tsx` | Page that includes JobsSection |
| `prisma/schema.prisma` | Database schema — Job model definition |
| `vercel.json` | Cron schedule configuration |
| `.env.local` | All secrets and environment variables |

---

## Quick Reference: How to Trigger a Job Sync Now

```bash
# Manual sync via curl (use this when you update jobs in Zoho and want them live immediately)
curl -X POST https://www.remontaservices.com.au/api/refresh-jobs \
  -H "x-api-secret: 3139dab64d48be4e839f89d9b7eb9be14b91307a306294f84587992bcb22f785"

# Check last sync time
curl https://www.remontaservices.com.au/api/sync-jobs

# View current live jobs
curl https://www.remontaservices.com.au/api/jobs
```

---

## Key Rules for AI Agents Working on This System

1. **Jobs are identified by `zohoId`** — the Zoho Deal ID. Never change this field or upserts will create duplicates.
2. **Stage filter is `"Recruitment End"`** — if a deal's stage changes in Zoho, it will be deactivated in the DB on next sync.
3. **`active: false` hides the job from the site** — it is never deleted from the DB (for audit purposes).
4. **The sync is idempotent** — running it multiple times is safe. Existing records are updated, not duplicated.
5. **Authentication levels:**
   - Public: `GET /api/jobs`
   - Protected: `POST /api/sync-jobs`, `POST /api/refresh-jobs` (require `SYNC_API_SECRET`)
   - Cron-only: `GET /api/cron/sync-jobs` (require `CRON_SECRET`)
6. **Do not modify `zoho.ts` token logic** — the 5-minute early expiry buffer prevents race conditions.
7. **The database is the source of truth for the frontend** — Zoho is the source of truth for job data.
