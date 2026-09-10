# Code Quality Assessment

**System**: Remonta Marketplace
**Analysis Date**: 2026-09-09T02:12:02Z

Findings below were verified by reading the referenced files, not inferred from naming or
convention. Where a first-pass search produced a wrong answer, the corrected result is what is
recorded.

---

## Test Coverage

| Dimension | Status |
|---|---|
| **Overall** | **None** for correctness |
| **Unit tests** | None. No Jest, Vitest or Testing Library dependency. |
| **Integration tests** | None. |
| **End-to-end tests** | None. No Playwright or Cypress. |
| **Load and performance** | Present — 5 k6 scripts under `tests/load/` (`smoke`, `load`, `stress`, `edit-profile`, `config.js`). |

k6 is invoked as an external binary and is not an npm dependency, so the test scripts do not run
from a clean checkout without a separate install.

---

## Code Quality Indicators

| Indicator | Status | Detail |
|---|---|---|
| **Linting** | Configured, **not enforced** | `eslint.config.mjs` extends `eslint-config-next`, but `next.config.ts` sets `eslint.ignoreDuringBuilds: true`. |
| **Type checking** | Configured, **not enforced** | `next.config.ts` sets `typescript.ignoreBuildErrors: true`. |
| **Formatting** | Enforced | Husky plus lint-staged runs Prettier with Tailwind class sorting on staged files. |
| **CI** | **None** | No `.github/workflows` or equivalent. |
| **Code style** | Mostly consistent | Clear directory conventions and the `@/*` alias throughout. Mixed quote style and mixed `axios`/`fetch` usage. |
| **Documentation** | Good in places | `auth-schema.prisma`, `middleware.ts`, `vercel.json` and the W1 modules carry genuinely explanatory comments. The W1 availability model documents *why* minutes-from-midnight and a four-column unique key were chosen — comments that record reasoning, not restatement. |
| **Secret hygiene** | Good | `.gitignore` excludes `.env*`; `git ls-files` confirms no env file is tracked. |

---

## Technical Debt

Ranked by severity.

### TD-1 — Unauthenticated admin endpoint performing mass database writes
**Severity: High** · `src/app/api/admin/fix-qualifications/route.ts`

`POST /api/admin/fix-qualifications` has no authentication or authorization of any kind — no
`requireRole`, no `getServerSession`, no shared secret. It loads every `VerificationRequirement`
with `isRequired: false` and issues an unbounded loop of `update` calls rewriting
`requirementName`.

Any unauthenticated caller who knows the path can trigger a full-table write against compliance
data. It is also an unbatched N+1 write.

It is described in its own comment as a "one-time migration", and `src/scripts/fixQualificationNames.ts`
is the script form of the same operation — so the endpoint is very likely dead code that was
never removed.

*Verification note: an initial grep suggested roughly twenty unguarded admin routes. That was a
false positive caused by a pattern that missed `requireRole` and `requireAnyRole`. After
correction, this is the **only** genuinely unguarded admin endpoint.*

**Recommendation**: delete the endpoint and keep the script.

---

### TD-2 — Unauthenticated file upload to Blob storage
**Severity: Medium** · `src/app/api/upload/worker-photo/route.ts`

`POST /api/upload/worker-photo` is unauthenticated by design, because it runs during registration
before a user exists. It validates the file through `validateImageFile`, but accepts an arbitrary
caller-supplied `email` form field and no rate limit is applied at the handler.

This permits anonymous writes into Vercel Blob — a storage-cost and content-abuse vector.

**Recommendation**: apply an Upstash rate limit (the infrastructure already exists in
`src/lib/ratelimit.ts`), and bind the upload to a short-lived registration token rather than a
free-text email.

---

### TD-3 — No automated gate can fail a build or deploy
**Severity: High** · `next.config.ts`, absent CI

Three facts compound:
1. `typescript.ignoreBuildErrors: true` — type errors cannot fail a build
2. `eslint.ignoreDuringBuilds: true` — lint errors cannot fail a build
3. No CI pipeline and no correctness tests

The only pre-merge check is Prettier formatting. A change that breaks types, violates lint rules,
or breaks behaviour will deploy. On a system holding disability-participant personal data and
statutory compliance evidence, this is the most consequential gap in the project.

**Recommendation**: this is the prerequisite for the monorepo migration, not a follow-up to it.
Re-enabling type checking is the single highest-value change, and a package split without it
will move broken code between packages invisibly.

---

### TD-4 — Coordinator dashboard has no role enforcement
**Severity: Medium** · `middleware.ts`, `src/app/dashboard/supportcoordinators/layout.tsx`

`middleware.ts` enforces the coordinator role with:

```ts
if (path.startsWith("/dashboard/coordinator") && token.role !== UserRole.COORDINATOR)
```

The actual route tree is `/dashboard/supportcoordinators`. `"/dashboard/supportcoordinators"`
does not start with `"/dashboard/coordinator"`, so this check never fires.

The route is still covered by the `/dashboard/:path*` matcher, so it requires **authentication**.
But its layout — like all four dashboard layouts — calls `useRequireAuth`, which checks only that
a session exists, never the role. The worker, client and admin equivalents are protected because
their middleware path checks do match.

Net effect: any authenticated user of any role can load the coordinator dashboard UI. Actual data
exposure is limited because `/api/coordinator/*` and `/api/client/*` enforce their own session
checks, so this is a defence-in-depth failure rather than a direct data breach — but it is a real
gap and the fix is one string.

**Recommendation**: correct the path to `/dashboard/supportcoordinators`, and add role assertion
to the layout guards so the two layers agree.

---

### TD-5 — Page labelled "Admin access only" with no access control
**Severity: Medium** · `src/app/remontaadmin/findsupport/page.tsx`

The page declares `description: 'Search and manage NDIS disability workers - Admin access only'`
and renders `SearchSupport`, the same worker-search component used by the admin console.

It has no protection whatsoever: `/remontaadmin` is not in the middleware matcher (which covers
only `/dashboard`, `/admin` and `/apply`), there is no layout in that route tree, and the page
performs no session check. It is also `force-dynamic`.

Exposure depends on which endpoints `SearchSupport` calls — the admin contractor endpoints do
enforce `requireRole(ADMIN)`, which would limit the damage to an empty or failing UI. But a page
that announces itself as admin-only while being publicly routable is either a live gap or
abandoned code.

**Recommendation**: confirm whether the route is still needed; delete it if not, and otherwise
bring it under `/admin` so the existing matcher covers it.

---

### TD-6 — Sync mutex is per-instance and cannot prevent concurrent runs
**Severity: Low** · `src/app/api/sync-jobs/route.ts`

Concurrency is guarded by a module-level `let isSyncing = false`. On Vercel this is per serverless
instance, so two concurrent invocations on different instances both proceed. The endpoint is
reachable both from the hourly cron and directly with `x-api-secret`.

Impact is limited because the writes are `upsert` on `zohoId` and therefore idempotent, but
concurrent runs will duplicate Zoho API quota and can interleave the deactivation pass with
another run's upserts.

**Recommendation**: move the lock to Redis, which is already a dependency.

---

### TD-7 — Duplicate capability across six dependency areas
**Severity: Medium (elevated by the monorepo goal)**

| Capability | Libraries |
|---|---|
| Server state | TanStack Query **and** SWR |
| UI primitives | Radix, MUI, Headless UI, chatscope |
| Styling | Tailwind, styled-components, Emotion |
| Email | Resend **and** Nodemailer |
| PDF | `@react-pdf/renderer` **and** jsPDF + html-to-image |
| Dates | date-fns **and** dayjs |
| HTTP | axios **and** native fetch |
| Icons | Heroicons **and** Lucide |

`pusher` and `pusher-js` are declared with no server usage found.

This inflates bundle size and forces a choice at every new component. It matters more than usual
here: a monorepo split has to assign each of these to a package, and propagating all of them into
both a web and a mobile package multiplies the cost.

**Recommendation**: settle these choices during package extraction rather than carrying the
ambiguity into new packages.

---

### TD-8 — Stale copy of the marketing product's schema on the app branch
**Severity: Low** *(revised down — see resolution below)*

**Original observation**: `prisma/schema.prisma` (`DATABASE_URL`) and `prisma/auth-schema.prisma`
(`AUTH_DATABASE_URL`) both define `Job`, `Document`, `Category`, `Subcategory`,
`CategoryDocument` and `SubcategoryDocument` with different shapes, which read as confused
ownership of the same concepts.

**Resolution (confirmed with the user, 2026-09-09)**: the two schemas belong to **two different
products**, not one confused design.

- `DATABASE_URL` → the **marketing website** database (the `main` branch product)
- `AUTH_DATABASE_URL` → the **web application** database (the `app/main` branch product)

They are separate physical databases. The apparent duplication is an artifact of the two products
sharing one git history — `app/main` carries a copy of the marketing product's schema file.

**What is actually live**: only **2 files** on `app/main` import the legacy client `@/lib/prisma`:

| File | Queries |
|---|---|
| `src/app/api/contractors/route.ts` | `contractorProfile.findMany`, `contractorProfile.count` |
| `src/app/api/contractors/[id]/route.ts` | `contractorProfile.findFirst` |

That is **3 queries against 1 model** — the web app's entire runtime dependency on the marketing
database. By comparison, 94 files use `authPrisma`.

The five extra models `app/main` added to its copy of `schema.prisma` (`Document`, `Category`,
`Subcategory`, `CategoryDocument`, `SubcategoryDocument`) are **never queried through the legacy
client**. The same models exist in `auth-schema.prisma` and are queried via `authPrisma`. They are
dead declarations on the wrong schema file, which is why `app/main` has no migrations for them.

The sole UI consumer of `/api/contractors` is `SearchSupport.tsx` — the component rendered by the
unprotected `/remontaadmin/findsupport` page (TD-5). The two findings are connected.

*Verification note: an intermediate count suggested far broader legacy usage. That was wrong —
several files alias the auth client with `import { authPrisma as prisma }`, so a `prisma.` search
matches auth-database calls. The corrected figure is 3 queries in 2 files.*

**Recommendation**: delete the five unused models from `app/main`'s `schema.prisma`. The real
cross-product coupling is one contractor-search endpoint, which is a deliberate integration point
to design rather than a defect to remove.

---

### TD-9 — Missing referential integrity on three relationships
**Severity: Medium** · `prisma/auth-schema.prisma`

| Field | Intended target | Constraint |
|---|---|---|
| `JobApplication.workerId` | `User.id` | None — comment only |
| `ServiceRequest.requesterId` | `User.id` | None |
| `VerificationRequirement.reviewedBy` | `User.id` | None |

These are plain `String` columns. Deleting a user orphans their applications, service requests and
review attributions with no cascade and no error. On compliance records, `reviewedBy` is audit
evidence of who approved a statutory document.

**Recommendation**: add the foreign keys with explicit `onDelete` behaviour.

---

### TD-10 — Stale W1 comment contradicts the migrated schema
**Severity: Low** · `prisma/auth-schema.prisma`

The W1 section header states:

> "Those columns REMAIN until W1 reaches phase P7, so both shapes coexist during dual-write.
> Nothing reads these tables until the read switch is flipped."

Both claims are now false. Migration `20260907160000_w1_drop_json_columns` dropped the four Json
columns, and commit `54cc6a3` made the typed tables the source of truth. The comment also points
to `aidlc-docs/inception/application-design/target-schema.md`, which does not exist in this
repository.

The migration itself was executed carefully — the availability unique key documents a real
finding from production data — so this is stale documentation on good work, not a defect in the
migration.

**Recommendation**: update the comment to describe the finished state and correct or remove the
dangling document reference.

---

### TD-11 — Service layer applied to only one of four domains
**Severity: Low**

`src/services/` contains 9 worker modules and 1 user module. The client, coordinator and admin
domains have no equivalent and keep their logic inline in route handlers.

The result is two different architectures in one codebase: worker features go
component → Server Action → Prisma, while client and admin features go component → HTTP route →
Prisma. This matters for the split, because only one of those two shapes is reachable from a
mobile app.

---

### TD-12 — Enums declared but unused
**Severity: Low** · `prisma/auth-schema.prisma`

`VerificationStatus` (5 values) and `RepresentativeType` (6 values) are declared but referenced by
no model field. `WorkerProfile.verificationStatus` is a plain `String` defaulting to
`"NOT_STARTED"` — the values are enforced only by convention.

**Recommendation**: type the column with the existing enum.

---

### TD-13 — Security headers scoped to dashboard routes only
**Severity: Low** · `next.config.ts`

The `headers()` block applies `no-store`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, and
`Referrer-Policy` to `/dashboard/:path*` only. Admin routes — which display the most sensitive
data in the system, including identity documents and compliance evidence — receive none of them.
There is no Content-Security-Policy or `Strict-Transport-Security` anywhere.

---

## Patterns and Anti-patterns

### Good Patterns

- **Deliberate public data projection** — `/api/public/workers` maps to an explicit `WorkerBio`
  shape (id, name, introduction, photo, city, state, services) rather than leaking a Prisma model.
  This is the correct way to expose a public directory and is worth preserving through the split.
- **Reasoned schema design in W1** — availability stored as minutes from midnight so slots sort
  and compare and overnight shifts are expressible; a four-column unique key chosen because
  production data actually contained two slots sharing a start time. The comments record the
  reasoning and the evidence.
- **Centralised guard helpers** — `src/lib/auth.ts` provides a clean throwing/non-throwing pair.
- **Prisma singleton per database** — correct serverless pattern, applied consistently.
- **Cache with explicit invalidation** — `getCached`/`setCached` keyed by `CACHE_KEYS`, with
  `invalidateCache` after mutations.
- **Declarative onboarding steps** — step definitions in `src/config` extended dynamically from
  selected services, keeping a complex wizard data-driven.
- **Thoughtful deployment configuration** — the Prisma bundling problem on Vercel is solved
  consistently across `next.config.ts` and `vercel.json`, with comments explaining why.
- **Defence in depth on cron** — `CRON_SECRET` at the cron entry point and `SYNC_API_SECRET` on
  the endpoint it calls.

### Anti-patterns

- **Authorization by per-file discipline** — the middleware never runs on `/api/*`, so every one
  of 86 handlers must remember its own guard. Nothing structural catches an omission, and
  TD-1 is what that costs.
- **Three inconsistent authorization styles** — `requireRole`, `requireAnyRole`, and inline
  `getServerSession` checks, split roughly by directory rather than by intent.
- **Direct database access from presentation** — 17 pages and components query Prisma inline,
  bypassing the API layer entirely (TD-4 in `dependencies.md` coupling analysis).
- **Suppressed compiler and linter** — the two cheapest correctness gates in the stack, both off.
- **Dead migration endpoint left routable** — TD-1.
- **Denormalised names without a sync path** — `WorkerService` stores `categoryName` and
  `subcategoryNames` alongside ids; renaming a `Category` leaves stale copies.
- **In-memory state in serverless** — the `isSyncing` mutex (TD-6).
- **Comments that outlive their truth** — TD-10.

---

## Assessment Summary

The codebase is **more disciplined than its lack of tests suggests**. The W1 migration was
executed in seven reviewed phases with real production-data verification, the domain layer is
cleanly server-side, and the deployment configuration solves genuine problems with recorded
reasoning. Somebody has been thinking carefully about this system.

The gap is between that care and its enforcement. There is no mechanism that makes the care
stick: no tests, no type checking, no lint gate, no CI. The defects found are consistent with
that — an abandoned migration endpoint nobody deleted, a role check whose path string drifted
from the route it guards, a comment describing a state the schema has moved past. Each is the
kind of thing a gate would have caught, and none of them is evidence of carelessness in design.

**For the monorepo and mobile goal specifically**, the priority order is:

1. **TD-3 first** — restore type checking and add CI before moving code between packages. A split
   without it relocates broken code invisibly, across two products.
2. **Branch consolidation** (see `branch-topology.md`) — `main` and `app/main` are two products
   sharing a git history, diverged 11 months, with 9 of 10 shared endpoints drifted. This is the
   actual driver of the monorepo work and delivers the clearest payoff.
3. **The 56 Server Actions and 17 direct-Prisma pages** (see `dependencies.md`) — the real scope
   of the mobile work. The worker onboarding domain, the product's core flow, has no HTTP
   surface a mobile client could call. Independent of the monorepo work.
4. **TD-1, TD-2, TD-4, TD-5** — small, self-contained security fixes worth doing before the
   restructure, while the code is still in one place and easy to reason about. TD-5 is
   entangled with the one genuine cross-product dependency (TD-8) and should be resolved with it.
5. **TD-8 is now cheap** — delete five dead model declarations; keep the single contractor-search
   integration as a designed boundary.
