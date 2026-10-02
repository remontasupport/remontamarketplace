# Code Structure — in-scope domains

## Build System
- **Type:** pnpm 9.15.9 workspaces (`apps/*`, `packages/*`, `node-linker=hoisted`) + Turborepo 2.x. Node ≥ 20.9.
- **Key config:**
  - `turbo.json`: tasks build, type-check(:baseline), lint(:baseline), test, quality, dev; `envMode: loose`.
  - `apps/app/vercel.json`: its `buildCommand` generates **both** Prisma clients, then runs `next build`, overriding `package.json` `build`.
  - `apps/app/next.config.ts:25,28`: `ignoreDuringBuilds` and `ignoreBuildErrors` are both **true**.
- **Quality baselines:** `apps/app/scripts/check-baseline.mjs`, with `.quality-baseline/typescript.txt` (149) and `eslint.txt` (523; CLAUDE.md says 518). `apps/web/.quality-baseline/eslint.txt` (76).
- **Prisma generation:**
  - `apps/app` `build`/`postinstall`/`db:generate` generate `src/generated/client` (legacy schema) and `src/generated/auth-client` (from `packages/db`). The generated clients are **committed** (56 files); regenerating changes absolute paths in 6 of them (see CLAUDE.md trap).
  - Migrations are run by hand (`pnpm --filter @remonta/app db:migrate:deploy`). No CI job runs them.

## Module hierarchy (in scope)

```mermaid
flowchart TD
    subgraph apps/app/src
      MW[middleware.ts]
      subgraph lib
        AUTHC[auth.config.ts<br/>NextAuth options]
        AUTH[auth.ts<br/>requireRole…]
        AP[auth-prisma.ts<br/>authPrisma client]
        RED[redis.ts / ratelimit.ts]
        EM[email.ts<br/>Resend]
        GEO[geocoding.ts / location-parser.ts]
        REG[workers/workerRegistrationProcessor.ts]
        BLOB[blobStorage.ts]
        VER[verification.ts — dead]
        OTP[otp.ts / password.ts]
        W1[w1/promote.ts, w1/read.ts]
      end
      subgraph services["services (use server)"]
        SW[worker/*: profile, additionalInfo,<br/>availability, experience, compliance,<br/>serviceDocuments, setupProgress,<br/>profilePreview, workerServices]
        SU[user/account.service.ts]
      end
      subgraph config
        SDR[serviceDocumentRequirements.ts]
        SQR[serviceQualificationRequirements.ts]
        MRS[mandatoryRequirementsSetupSteps.ts]
        ASS[accountSetupSteps.ts]
      end
      subgraph api["app/api (route handlers)"]
        AA[auth/*]
        AD[admin/compliance/*, admin/impersonate,<br/>admin/contractors/[id]/status]
        UP[compliance/upload, upload/*, blob/upload-token]
        WK[worker/*]
      end
    end
    AA --> AUTHC & OTP & EM & REG
    AD --> AUTH & AP
    UP --> BLOB & AP
    WK --> AP & SDR
    SW --> AP & W1 & SDR & GEO
    REG --> AP & GEO
    AUTHC --> AP & RED
```

## Existing Files Inventory (in scope; candidates for replacement or modification)

**Identity / auth**
- `apps/app/middleware.ts`: page-only role gating (`/dashboard`, `/admin`, `/apply`)
- `apps/app/src/lib/auth.config.ts`: NextAuth options, normal and impersonation login, lockout, login cache, cookies
- `apps/app/src/lib/auth.ts`: `requireAuth/requireRole/requireAnyRole` (throw → 500)
- `apps/app/src/lib/auth-prisma.ts`: `authPrisma` (`@/generated/auth-client`, pooled, `withRetry`)
- `apps/app/src/lib/password.ts`: bcryptjs cost 12, verification codes
- `apps/app/src/lib/otp.ts`: stateless HMAC OTP
- `apps/app/src/lib/impersonation.ts`, `components/admin/ImpersonationButton.tsx`: client impersonation helpers
- `apps/app/src/app/api/auth/*`: forgot/reset/setup-password, send/verify-otp, check-email, register*
- `apps/app/src/app/api/admin/impersonate/route.ts`, `api/admin/contractors/[id]/status/route.ts`
- `apps/app/src/services/user/account.service.ts`: email, password and phone changes
- `apps/app/scripts/create-admin-user.ts`, `promote-to-admin.ts`, `verify-user-manually.ts`

**Registration**
- `apps/app/src/app/registration/worker/page.tsx` (+ steps; `utils/registrationUtils.ts`)
- `apps/app/src/app/api/auth/register-async/route.ts`: live route; hardcoded n8n URL `:115`
- `apps/app/src/lib/workers/workerRegistrationProcessor.ts`: creates User + WorkerProfile + WorkerService, audit, env n8n webhook
- `apps/app/src/lib/recaptcha.ts`, `lib/geocoding.ts`, `lib/location-parser.ts`

**Onboarding**
- `apps/app/src/services/worker/*.service.ts`: 9 server-action modules (see `api-documentation.md`)
- `apps/app/src/hooks/queries/useWorkerProfile.ts`, `hooks/useWorkerProfile.ts`: client dispatch to actions
- `apps/app/src/app/api/worker/*`: profile, requirements, documents
- `apps/app/src/app/api/compliance/upload/route.ts`, `api/upload/*`, `lib/blobStorage.ts`, `lib/backgroundUploadQueue.ts`
- `apps/app/src/config/serviceDocumentRequirements.ts` (302 lines; 9 service lines), `serviceQualificationRequirements.ts`, `mandatoryRequirementsSetupSteps.ts`, `accountSetupSteps.ts`
- `apps/app/src/lib/w1/promote.ts`, `w1/read.ts`: the W1 child-table promotion from the previous cycle

**Compliance**
- `apps/app/src/app/api/admin/compliance/**`: 8 routes (see `api-documentation.md`)
- `apps/app/src/app/admin/manage/CheckComplianceContent.tsx`, `app/admin/compliance/[id]/page.tsx`: admin UI
- `apps/app/src/lib/verification.ts`, `api/admin/verification/route.ts`: abandoned flow

**Notifications**
- `apps/app/src/lib/email.ts`: Resend wrapper, 3 templates (1 unused)

**Shared packages**
- `packages/db/prisma/schema.prisma`: the source of truth
- `packages/db/prisma/migrations/`: `0_init` + 4 W1 migrations
- `packages/schemas/src/schema/{contractorFormSchema, workerProfileSchema, registrationSchema}.ts`, `types/{auth, setupProgress}.ts`
- `packages/config/eslint.boundaries.mjs`: P-1..P-5

## Design Patterns (as found)

### Server actions as the service layer
- **Location:** `services/worker/*`, `services/user/*`
- **Purpose:** direct browser → DB calls without an API route
- **Implementation:** `"use server"` modules that each read the session themselves. **Every exported function is a public RPC endpoint.** Several take a caller-supplied `userId` without an ownership check (H1, M12).

### Cache-aside with Redis
- **Location:** `lib/redis.ts` `getOrFetch`
- **Purpose:** reduce DB reads on serverless
- **Implementation:** versioned keys (`v3`) with per-entity TTLs. Invalidation is patchy; the login cache is the dangerous case (M6).

### Fire-and-forget side effects
- **Location:** webhooks, status updates, `failedLoginAttempts`
- **Purpose:** keep responses fast
- **Implementation:** unawaited `fetch(...).catch(()=>{})`. On serverless these can be dropped after the response is sent.

### W1 promotion (child tables)
- **Location:** `lib/w1/promote.ts`, `w1/read.ts`
- **Purpose:** the previous cycle moved JSON columns into child tables (WorkerJobHistory, WorkerEducation, WorkerAvailability, WorkerExperience)
- **Implementation:** rebuilt in a transaction on save; covered by PBT (`w1/promote.test.ts`). **A good precedent** for the new service.

## Critical Dependencies

| Dependency | Version | Usage | Note for the new service |
|---|---|---|---|
| next-auth | ^4.24.11 (4.24.15 installed) | Credentials + JWT | Stays in `apps/app` (C5 A); `exp` override bug (M4) |
| @prisma/client / prisma | ^6.16.2 | both apps, generated clients committed | `apps/api` needs its own generated client; `packages/db` has no runtime export yet (U9 options in its README) |
| zod | ^4.1.11 | `packages/schemas` | Reusable as the contract schema language (NFR-ARCH-02) |
| @vercel/blob | ^2.0.0 | all uploads, public | Replaced by AU private storage (OI-07) |
| @upstash/redis, @upstash/ratelimit | ^1.35.6, ^2.0.6 | cache, rate limit | Residency is OI-08 |
| resend | ^6.1.2 | email | Kept behind an interface (FR-INT-03) |
| bcryptjs | ^3.0.2 | password hashing | Cost 10 vs 12 (FR-ACC-04) |
| fast-check | ^4.9.0 | PBT, 3 test files | Precedent for PBT under full enforcement |
