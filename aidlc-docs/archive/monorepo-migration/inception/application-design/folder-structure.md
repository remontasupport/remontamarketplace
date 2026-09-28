# Target Folder Structure

**Stage**: INCEPTION — Application Design
**Date**: 2026-09-09

The complete target tree, with every existing file mapped to its destination. Derived from
AD-01..AD-15 in `application-design.md`.

**Delivery note**: under D-40 (incremental) this is the *end state*, not a one-step move. Each unit
moves one layer, leaving both apps deployable. Temporary re-export shims are expected mid-flight.

---

## 1. Complete Tree

```
remonta/
├── package.json                     # workspace root, private, no app deps
├── pnpm-workspace.yaml              # apps/*, packages/*
├── turbo.json                       # pipeline: build, lint, type-check, test
├── tsconfig.json                    # extends packages/config/tsconfig/base.json
├── .gitignore
├── .npmrc                           # pnpm settings
├── .husky/                          # pre-commit -> lint-staged
├── README.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # NEW: type-check, lint, test, boundary check
│       └── deploy.yml               # optional; Vercel Git integration may suffice
│
├── apps/
│   │
│   ├── web/                         # MARKETING  (from `main`)
│   │   ├── package.json             # deps: api-client, ui, schemas, integrations, config
│   │   │                            # MUST NOT list: db, domain-*        [P-1, P-2]
│   │   ├── next.config.ts
│   │   ├── vercel.json              # Vercel project 1, root = apps/web
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts        # extends packages/config theme
│   │   ├── sanity.config.ts
│   │   ├── sanity/
│   │   │   └── schemas/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── globals.css
│   │       │   ├── robots.ts
│   │       │   ├── sitemap.ts
│   │       │   ├── landing/
│   │       │   ├── services/
│   │       │   ├── policy/
│   │       │   ├── contact/
│   │       │   ├── newsroom/
│   │       │   │   └── [slug]/
│   │       │   ├── area/[slug]/
│   │       │   ├── provide-support/
│   │       │   ├── support-coordinators/
│   │       │   ├── find-support/
│   │       │   ├── search/
│   │       │   ├── search-workers/
│   │       │   ├── workers/[id]/
│   │       │   ├── registration/
│   │       │   ├── studio/[[...index]]/       # Sanity Studio
│   │       │   └── api/
│   │       │       ├── articles/
│   │       │       │   ├── route.ts
│   │       │       │   ├── featured/route.ts
│   │       │       │   └── [slug]/route.ts
│   │       │       ├── send-contact/route.ts   # uses packages/integrations
│   │       │       ├── send-feedback/route.ts  # uses packages/integrations
│   │       │       └── suburbs/route.ts        # static data from packages/schemas
│   │       ├── components/
│   │       │   ├── ArticleClientWrapper.tsx
│   │       │   ├── ArticleMetaTags.tsx
│   │       │   ├── PortableTextComponents.tsx
│   │       │   └── sections/
│   │       │       ├── HowItWorks.tsx
│   │       │       ├── JobsSection.tsx
│   │       │       ├── SearchBarSection.tsx
│   │       │       └── ServicesSlider.tsx
│   │       └── lib/
│   │           ├── sanity/
│   │           │   ├── client.ts
│   │           │   ├── config.ts
│   │           │   ├── queries.ts
│   │           │   └── jobQueries.ts
│   │           └── seo/
│   │               ├── faq-schema.ts
│   │               └── sitelinks-search-box.ts
│   │
│   ├── app/                         # APPLICATION  (from `app/main`)
│   │   ├── package.json             # deps: all domain-*, domain-core, ui,
│   │   │                            #       schemas, integrations, config
│   │   ├── next.config.ts           # ignoreBuildErrors REMOVED  [FR-6.1]
│   │   ├── vercel.json              # Vercel project 2, root = apps/app; hourly cron
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── middleware.ts            # role check path FIXED  [FR-5.3 / TD-4]
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── login/  forgot-password/  reset-password/  setup-password/
│   │       │   ├── registration/
│   │       │   │   ├── worker/       clients/       coordinator/
│   │       │   ├── auth/verify-email/
│   │       │   ├── unauthorized/
│   │       │   ├── apply/
│   │       │   ├── share/profile/[token]/
│   │       │   ├── workers/[id]/profile/
│   │       │   ├── dashboard/
│   │       │   │   ├── worker/            # 12 pages
│   │       │   │   ├── client/            # 7 pages
│   │       │   │   └── supportcoordinators/   # 9 pages
│   │       │   ├── admin/                 # 7 pages + layout
│   │       │   └── api/                   # ~80 routes (see §4)
│   │       ├── components/                # 163 minus ui/ -> packages/ui
│   │       │   ├── account-setup/  admin/  contracts/  dashboard/
│   │       │   ├── forms/  modals/  pdf/  profile/  profile-building/
│   │       │   ├── providers/  requirements-setup/  services-setup/
│   │       │   ├── SearchSupport.tsx
│   │       │   └── ApiInterceptorSetup.tsx
│   │       ├── actions/                   # "use server" wrappers + orchestration [AD-08]
│   │       │   ├── worker/
│   │       │   │   ├── profile.actions.ts
│   │       │   │   ├── additionalInfo.actions.ts
│   │       │   │   ├── availability.actions.ts
│   │       │   │   ├── experience.actions.ts
│   │       │   │   ├── compliance.actions.ts
│   │       │   │   ├── serviceDocuments.actions.ts
│   │       │   │   ├── setupProgress.actions.ts
│   │       │   │   ├── workerServices.actions.ts
│   │       │   │   └── profilePreview.actions.ts
│   │       │   ├── user/account.actions.ts
│   │       │   └── suburbs.ts
│   │       ├── server/                    # transport helpers
│   │       │   ├── resolveActor.ts        # NextAuth session -> Actor  [AD-04]
│   │       │   ├── errorResponse.ts       # Result/throw -> HTTP  [SECURITY-15]
│   │       │   └── authOptions.ts         # NextAuth config
│   │       ├── integrations/              # app-local clients  [AD-02]
│   │       │   ├── zoho.ts
│   │       │   ├── blobStorage.ts
│   │       │   ├── redis.ts
│   │       │   ├── ratelimit.ts
│   │       │   ├── recaptcha.ts
│   │       │   ├── geocoding.ts           # external API — see §6 note
│   │       │   └── sms.ts
│   │       ├── hooks/
│   │       │   ├── queries/                # 8 TanStack Query hooks
│   │       │   ├── useRequireAuth.ts       # now asserts role too  [FR-5.3]
│   │       │   └── use*.ts                 # 6 others
│   │       ├── store/onboardingStore.ts
│   │       ├── contexts/ProgressContext.tsx
│   │       ├── providers/QueryProvider.tsx
│   │       ├── config/                     # 10 step/content definitions
│   │       ├── constants/                  # 8 reference modules
│   │       ├── utils/                      # 10 app-level helpers
│   │       └── lib/
│   │           ├── logger.ts
│   │           ├── cache-invalidation.ts
│   │           ├── api-interceptor.ts
│   │           ├── shareToken.ts
│   │           └── reports.ts
│   │
│   └── mobile/                      # EXPO SCAFFOLD  [D-37, structure only]
│       ├── package.json             # deps: api-client, schemas, config
│       │                            # MUST NOT list: db, domain-*, ui   [P-3]
│       ├── app.json
│       ├── tsconfig.json
│       └── src/
│           └── App.tsx              # placeholder
│
└── packages/
    │
    ├── config/                      # depends on nothing
    │   ├── package.json
    │   ├── tsconfig/
    │   │   ├── base.json
    │   │   ├── next-app.json
    │   │   ├── react-library.json
    │   │   └── node-library.json
    │   ├── eslint/
    │   │   ├── base.js
    │   │   ├── next.js
    │   │   └── boundaries.js        # enforces P-1..P-5  [AD-10, AD-11]
    │   ├── prettier/index.js
    │   └── tailwind/
    │       ├── theme.ts             # shared theme — identical look  [AD-14, D-13]
    │       └── preset.ts
    │
    ├── schemas/                     # depends on: config
    │   ├── package.json             # NO next, react, dom, prisma  [P-5]
    │   └── src/
    │       ├── enums/
    │       │   ├── userRole.ts  accountStatus.ts  requirementStatus.ts
    │       │   ├── documentCategory.ts  careDomain.ts  dayOfWeek.ts
    │       │   ├── serviceRequestStatus.ts  fundingType.ts
    │       │   └── jobApplicationStatus.ts
    │       ├── worker/
    │       │   ├── profile.schema.ts  availability.schema.ts
    │       │   ├── education.schema.ts  jobHistory.schema.ts
    │       │   ├── experience.schema.ts  additionalInfo.schema.ts
    │       │   └── services.schema.ts
    │       ├── identity/
    │       │   ├── registration.schema.ts  credentials.schema.ts
    │       │   └── passwordReset.schema.ts
    │       ├── demand/
    │       │   ├── participant.schema.ts  serviceRequest.schema.ts
    │       ├── verification/requirement.schema.ts
    │       ├── search/
    │       │   ├── publicCriteria.schema.ts   # NO visibility field  [FR-10.7]
    │       │   └── adminCriteria.schema.ts
    │       ├── jobs/job.schema.ts
    │       ├── reference/
    │       │   └── australianPostcodes.ts     # static, zero-dependency
    │       └── index.ts
    │
    ├── domain-core/                 # depends on: schemas          [AD-15]
    │   ├── package.json
    │   └── src/
    │       ├── actor.ts             # Actor discriminated union  [AD-04]
    │       ├── result.ts            # Result<T, E>               [AD-06]
    │       ├── errors.ts            # DomainError + thrown classes
    │       ├── authz.ts             # assertRole, assertSelfOrRole, assertOwns [AD-05]
    │       ├── pagination.ts        # Paginated<T>
    │       └── index.ts
    │
    ├── db/                          # depends on: schemas          [AD-07]
    │   ├── package.json
    │   ├── prisma/
    │   │   ├── schema.prisma        # consolidated; ContractorProfile REMOVED [D-38]
    │   │   └── migrations/          # existing 5 + retirement migrations
    │   └── src/
    │       ├── client.ts            # internal only — NOT exported from index
    │       ├── transaction.ts       # withTransaction()  (required by O-3)
    │       ├── repositories/
    │       │   ├── worker.repository.ts
    │       │   ├── search.repository.ts
    │       │   ├── verification.repository.ts
    │       │   ├── identity.repository.ts
    │       │   ├── demand.repository.ts
    │       │   ├── jobs.repository.ts
    │       │   └── taxonomy.repository.ts
    │       ├── generated/           # Prisma client output — see §6 note
    │       └── index.ts             # exports repositories + withTransaction only
    │
    ├── integrations/                # depends on: schemas          [AD-02]
    │   ├── package.json
    │   └── src/
    │       ├── email/
    │       │   ├── client.ts        # Resend  (Nodemailer retired)
    │       │   └── templates/       # React Email
    │       └── index.ts
    │
    ├── ui/                          # depends on: config           [AD-12, AD-13]
    │   ├── package.json             # Radix + Tailwind only
    │   └── src/
    │       ├── primitives/          # ~27 consolidated from BOTH apps
    │       │   ├── button.tsx  card.tsx  input.tsx  label.tsx  select.tsx
    │       │   ├── checkbox.tsx  radio-group.tsx  textarea.tsx  form.tsx
    │       │   ├── dialog.tsx  popover.tsx  command.tsx  progress.tsx
    │       │   ├── alert.tsx  calendar.tsx  searchable-select.tsx
    │       │   ├── location-dropdown.tsx  language-select.tsx
    │       │   └── service-select.tsx
    │       ├── feedback/
    │       │   ├── Loader.tsx  LoadingOverlay.tsx  ProgressBar.tsx
    │       │   ├── ConfirmDialog.tsx  ErrorModal.tsx
    │       ├── layout/
    │       ├── WorkerAvatar.tsx
    │       ├── styles/globals.css
    │       └── index.ts
    │
    ├── api-client/                  # depends on: schemas          [AD-09]
    │   ├── package.json
    │   └── src/
    │       ├── createApiClient.ts   # baseUrl + optional getToken
    │       ├── resources/
    │       │   └── workers.ts       # listPublic, getPublic — PUBLIC ONLY [FR-10.7]
    │       ├── http.ts              # fetch wrapper, Result normalisation
    │       └── index.ts
    │
    ├── domain-identity/             # depends on: domain-core, db
    │   ├── package.json
    │   └── src/
    │       ├── registration.ts  credentials.ts  password.ts
    │       ├── session.ts  impersonation.ts  audit.ts
    │       └── index.ts
    │
    ├── domain-worker/               # depends on: domain-core, db
    │   ├── package.json
    │   └── src/
    │       ├── profile.ts  additionalInfo.ts  availability.ts
    │       ├── education.ts  jobHistory.ts  experience.ts
    │       ├── services.ts  setupProgress.ts  profilePreview.ts
    │       └── index.ts
    │
    ├── domain-verification/         # depends on: domain-core, db
    │   ├── package.json
    │   └── src/
    │       ├── requirements.ts      # derivation incl. CONDITIONAL docs
    │       ├── review.ts            # approve / reject / reset / expiry
    │       ├── verification.ts      # submit / approve / reject / publish
    │       ├── featureAccess.ts     # BASIC / VERIFIED / PREMIUM
    │       ├── statistics.ts
    │       └── index.ts
    │
    ├── domain-demand/               # depends on: domain-core, db
    │   ├── package.json
    │   └── src/
    │       ├── participants.ts  serviceRequests.ts
    │       ├── workerSelection.ts  lifecycle.ts
    │       └── index.ts
    │
    ├── domain-jobs/                 # depends on: domain-core, db
    │   ├── package.json
    │   └── src/
    │       ├── jobBoard.ts  applications.ts  sync.ts
    │       └── index.ts
    │
    └── domain-search/               # depends on: domain-core, db
        ├── package.json
        └── src/
            ├── publicSearch.ts      # forces visibility=public  [FR-10.7]
            ├── adminSearch.ts       # assertRole(ADMIN) first    [FR-10.7]
            ├── locationParser.ts    # pure — no external calls
            ├── projections.ts       # WorkerBio vs WorkerSummary
            └── index.ts
```

---

## 2. Source → Destination Map

### From `app/main`

| Current | Destination |
|---|---|
| `prisma/auth-schema.prisma` | `packages/db/prisma/schema.prisma` |
| `prisma/migrations/` | `packages/db/prisma/migrations/` |
| `src/generated/auth-client/` | `packages/db/src/generated/` |
| `prisma/schema.prisma` (legacy) | **RETIRED** — 5 dead models, marketing DB decommissioned |
| `prisma/schema.target.prisma` | **RETIRED** — design reference, superseded by this design |
| `src/lib/auth.ts`, `auth.config.ts` | split: guards → `domain-core/authz`, NextAuth config → `apps/app/src/server/authOptions.ts` |
| `src/lib/auth-prisma.ts`, `prisma.ts` | `packages/db/src/client.ts` (internal) |
| `src/lib/password.ts` | `packages/domain-identity/src/password.ts` |
| `src/lib/impersonation.ts` | `packages/domain-identity/src/impersonation.ts` |
| `src/lib/verification.ts` | `packages/domain-verification/src/verification.ts` |
| `src/lib/feature-access.ts` | `packages/domain-verification/src/featureAccess.ts` |
| `src/lib/worker-search.ts` | `packages/domain-search/` + `packages/db/src/repositories/search.repository.ts` |
| `src/lib/location-parser.ts` | `packages/domain-search/src/locationParser.ts` |
| `src/lib/geocoding.ts` | `apps/app/src/integrations/geocoding.ts` — external call, see §6 |
| `src/lib/data/australianPostcodes.ts` | `packages/schemas/src/reference/` |
| `src/lib/zoho.ts` | `apps/app/src/integrations/zoho.ts`; sync logic → `packages/domain-jobs/src/sync.ts` |
| `src/lib/email.ts` | `packages/integrations/src/email/` (Resend kept, Nodemailer dropped) |
| `src/lib/blobStorage.ts`, `redis.ts`, `ratelimit.ts`, `recaptcha.ts` | `apps/app/src/integrations/` |
| `src/lib/logger.ts`, `cache-invalidation.ts`, `api-interceptor.ts`, `shareToken.ts`, `reports.ts` | `apps/app/src/lib/` |
| `src/lib/profileData.ts` | `packages/domain-worker/` |
| `src/lib/w1/promote.ts`, `read.ts` | `packages/db/src/repositories/worker.repository.ts` (W1 complete; helpers fold in) |
| `src/services/worker/*.ts` (9) | logic → `packages/domain-worker/`; wrappers → `apps/app/src/actions/worker/` |
| `src/services/user/account.service.ts` | logic → `packages/domain-identity/`; wrapper → `apps/app/src/actions/user/` |
| `src/schema/*.ts` (5) | `packages/schemas/src/` |
| `src/types/*.ts` | `packages/schemas/src/` (except `next-auth.d.ts` → `apps/app`) |
| `src/lib/validations/contractor.ts` | `packages/schemas/src/` |
| `src/components/ui/` (27) | `packages/ui/src/` |
| `src/components/**` (rest) | `apps/app/src/components/` |
| `src/app/**` | `apps/app/src/app/` |
| `src/hooks`, `store`, `contexts`, `providers`, `config`, `constants`, `utils` | `apps/app/src/` |
| `middleware.ts` | `apps/app/middleware.ts` |
| `tests/load/` | `apps/app/tests/load/` |
| `scripts/`, `src/scripts/` | `apps/app/scripts/` |

### From `main`

| Current | Destination |
|---|---|
| `src/app/**` (marketing pages) | `apps/web/src/app/` |
| `sanity/`, `sanity.config.ts` | `apps/web/` |
| `src/lib/sanity/` | `apps/web/src/lib/sanity/` |
| `src/lib/schema/` (SEO) | `apps/web/src/lib/seo/` |
| `src/components/sections/`, article components | `apps/web/src/components/` |
| `src/components/ui/` (19) | **merge into** `packages/ui` — duplicates the app's set |
| `src/lib/prisma.ts` | **RETIRED** — P-1, no DB access |
| `prisma/` | **RETIRED** — marketing DB decommissioned |
| `src/lib/zoho.ts` | **RETIRED** — contractor sync retired (D-38) |
| `src/lib/blobStorage.ts`, `geocoding.ts`, `ratelimit.ts`, `logger.ts` | **RETIRED** or superseded |
| `src/lib/data/`, `src/lib/constants/`, `src/lib/utils/`, `src/lib/validations/` | `packages/schemas` / `packages/config` |
| `src/generated/` | **RETIRED** |

---

## 3. Retired

| Item | Reason |
|---|---|
| `ContractorProfile`, `ContractorsbyArea`, legacy `Job` | D-38, FR-10.4 — verify-then-drop per FR-10.6 |
| `/api/contractors`, `/api/contractors/[id]` (both apps) | FR-10.4 |
| `/api/contractors-by-area` (marketing) | FR-10.4 |
| `/api/sync-contractors`, `/api/webhooks/zoho-contractor` (marketing) | FR-10.4 |
| Marketing `/api/sync-jobs`, `/api/refresh-jobs`, `/api/jobs` | FR-10.3 — duplicate sync, unscheduled, stale |
| Marketing `/api/public/workers` | Replaced by `api-client` call to `apps/app` |
| `/api/test-zoho` (marketing) | Debug endpoint |
| `/api/admin/fix-qualifications` | **FR-5.1 / TD-1 — unauthenticated mass write** |
| `/remontaadmin/findsupport` (**both branches**) | **FR-5.2 / TD-5 — labelled admin-only, no guard** |
| Marketing database (`DATABASE_URL`) | D-34, FR-7.5 |
| MUI, Headless UI, chatscope | AD-12 |
| styled-components, Emotion | AD-13 |
| Nodemailer | Resend retained |
| `pusher`, `pusher-js` | No usage found |
| One of `date-fns` / `dayjs` | dayjs was an MUI peer; MUI is going |
| One of Heroicons / Lucide | Duplicate icon sets |
| SWR **or** TanStack Query | Pick one; TanStack has 8 existing hooks |
| `typescript.ignoreBuildErrors`, `eslint.ignoreDuringBuilds` | FR-6.1 |

> `/remontaadmin/findsupport` exists on **both** branches. TD-5 must be fixed in two places.

---

## 4. `apps/app/src/app/api` After Changes

Retained groups: `auth/**` (11), `admin/**` (23 — minus `fix-qualifications`), `worker/**` (13),
`client/**` (9), `coordinator/profile`, `upload/**` (6), `compliance/upload`, `blob/upload-token`,
`share/**` (2), `sms/**` (2), `cron/sync-jobs`, `sync-jobs`, `zoho/leads`, `categories/**`,
`subcategories`, `suburbs`, `geocode`, `articles/**`, `apply`, `public/workers`, `jobs`.

New:

| Route | Purpose |
|---|---|
| `GET /api/admin/workers/search` | Admin worker search on `WorkerProfile` — all statuses (FR-4.2). Replaces `/api/contractors`. Requires ADMIN. |
| `GET /api/health` | Health check (RESILIENCY-06, NFR-4.5) |

`GET /api/public/workers` is retained and gains a second consumer — `apps/web` via `api-client`.
It must be rate-limited (SECURITY-11).

---

## 5. Boundary Enforcement (P-1..P-5)

The prohibitions are enforced by what each `package.json` **omits**, backed by a CI lint rule
(AD-10).

```jsonc
// apps/web/package.json — marketing
{
  "dependencies": {
    "@remonta/api-client":   "workspace:*",
    "@remonta/ui":           "workspace:*",
    "@remonta/schemas":      "workspace:*",
    "@remonta/integrations": "workspace:*"
    // ABSENT, deliberately: @remonta/db, @remonta/domain-*   [P-1, P-2]
  }
}
```

```jsonc
// apps/mobile/package.json — Expo
{
  "dependencies": {
    "@remonta/api-client": "workspace:*",
    "@remonta/schemas":    "workspace:*"
    // ABSENT: @remonta/db, @remonta/domain-*, @remonta/ui    [P-3]
  }
}
```

```jsonc
// packages/domain-worker/package.json — every domain package
{
  "dependencies": {
    "@remonta/domain-core": "workspace:*",
    "@remonta/db":          "workspace:*"
    // ABSENT: every other @remonta/domain-*                  [P-4]
  }
}
```

pnpm's strict isolation makes a missing declaration a build failure rather than a silent hoist —
which is why it was chosen (D-08). The CI rule adds a readable error message.

---

## 6. Notes and One Correction

**Correction to `components.md`.** That document lists `src/lib/geocoding.ts` under
`domain-search`. That conflicts with the rule in `services.md` that domain packages never call
external services directly. **Resolution**: the geocoding *client* lives in
`apps/app/src/integrations/geocoding.ts`; `domain-search` receives coordinates as input and keeps
only the pure `locationParser`. `components.md` should be amended.

**Prisma generated client (R-5).** Currently at `src/generated/auth-client`, committed, and
force-bundled by both `next.config.ts` (`outputFileTracingIncludes`, `serverExternalPackages`) and
`vercel.json` (`includeFiles`). Moving it to `packages/db/src/generated/` breaks all those paths.
Both apps' configs must be updated together, and this is the single most likely thing to break the
build during migration. Infrastructure Design owns it.

**`src/components/ui` duplication is real.** Marketing has 19 primitives, the app has 27, with
16 overlapping by filename — `button`, `card`, `checkbox`, `command`, `dialog`, `form`, `input`,
`label`, `popover`, `progress`, `radio-group`, `searchable-select`, `select`, `textarea`,
`location-dropdown`, `layout`. They have drifted independently for eleven months. `packages/ui`
must reconcile each pair, not simply copy one side.

**`src/services` becomes `src/actions`.** The rename is deliberate: these files are no longer a
service layer, they are transport wrappers (AD-08). Keeping the name `services` beside
`packages/domain-*` would mislead.

**Marketing keeps three static-data endpoints.** `suburbs`, plus the Sanity-backed `articles`
routes, and `send-contact` / `send-feedback` through `packages/integrations`. None touch a
database, so D-35 is preserved.

**Workspace totals**: 3 apps, 13 packages, 16 workspace entries.
