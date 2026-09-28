# Code Quality Assessment — in-scope domains

## Test Coverage
- **Overall:** Poor for the in-scope domains. **No tests** of any API route, server action, auth, compliance or database path.
- **Unit tests:** 6 Vitest files in `apps/app` (~60 cases): `contractContent.test.ts`, `contractPdf.test.ts`, `otp.test.ts` (fast-check), `password.test.ts`, `w1/promote.test.ts` (fast-check), `serviceSlugMapping.test.ts` (fast-check).
- **Integration tests:** none.
- **Load:** 4 k6 scripts in `apps/app/tests/load/`.
- **Implication:** the strangler cannot rely on existing tests to prove parity. `apps/api` needs contract tests and the 15 PBT properties from `stories.md` from the start.

## Code Quality Indicators
- **Linting:** configured, with a baseline. `apps/app` tolerates 523 existing ESLint issues and 149 type errors. **Builds ignore both** (`next.config.ts:25,28`), so type errors reach production. `SUPER_ADMIN` resolving to `undefined` is one example.
- **Boundary rules:** P-1/P-2/P-5 applied to `apps/web` and `packages/schemas`; **none applied to `apps/app`**.
- **Code style:** inconsistent. Each capability has two implementations (route and action), errors are handled differently per route, and several files run to 500–1700 lines (`setupProgress.service.ts`, `additionalInfo.service.ts`, `api/admin/contractors/route.ts`).
- **Documentation:** fair in places (the W1 comments and the `packages/db` README are good); comments sometimes contradict the code (e.g. `public/workers:291` "published only").

## Technical Debt (in scope)
- **Catalogue in three places:** DB tables (no seeder), `config/serviceDocumentRequirements.ts`, and the hardcoded lists in `api/admin/compliance/[id]/route.ts:13-56`. Plus `serviceQualificationRequirements.ts` and `mandatoryRequirementsSetupSteps.ts`.
- **Eight upload routes** with different rules; a `findFirst`-then-`create` race on requirement rows at ≥ 2 sites, and no unique constraint (schema `:208`).
- **Verification status:** a free string in the column, while the enum is orphaned. Values in the wild: `NOT_STARTED`, `IN_PROGRESS`, `PENDING_REVIEW`, `'Verified'`, and potentially `APPROVED`/`REJECTED`. Every upload resets it to `PENDING_REVIEW`.
- **Progress:** a stored JSON with 4 flags that clients can set freely; on read it's recomputed from scratch (60 s cache); the 5th flag is hardcoded `false`; the percentage is computed on the client.
- **DOB** is a string and `age` is computed once, so it goes stale.
- **Dead code:** `lib/verification.ts` (references non-existent fields), `api/admin/verification`, `api/auth/register` (legacy), `api/blob/upload-token`, `saveComplianceDocumentRecord`, `lib/feature-access.ts`, `lib/worker-search.ts`, `sendWelcomeEmail`, the SMS verification path, `invalidateUserCaches`, `IndicativeRatesSection`, the `LocationsSection` / `NdisScreeningSection` stubs.
- **Two databases**, with an unfinished consolidation (D-34/D-35); the legacy client's env fallback may point at the auth DB.
- **Migrations applied manually;** the U8 summary says 7 migrations moved, but 5 folders exist today (unexplained).
- **Audit gaps:** AuditAction values LOGOUT, PASSWORD_CHANGE, EMAIL_CHANGE, ACCOUNT_LOCKED/UNLOCKED are never written; ROLE_CHANGE and EMAIL_VERIFIED only by scripts; registration logs `LOGIN_SUCCESS`; `ipAddress`/`userAgent` are never populated; no compliance decision is audited.

## Patterns and Anti-patterns
- **Good patterns:**
  - The W1 child-table promotion with PBT (`lib/w1/promote.ts` + test).
  - Session-scoped onboarding actions validated with the shared Zod schemas (`workerProfileSchema`).
  - `forgot-password` doesn't reveal whether an account exists.
  - Constant-time HMAC compare in `otp.ts`.
  - Versioned cache keys.
  - Expand/contract migrations with `down.sql` in `packages/db`.
- **Anti-patterns:**
  - **Opt-in security per endpoint.** Middleware skips `/api` and server actions (root cause of H1–H3, M1–M3, M12–M13).
  - **Exported server actions trusting a caller-supplied `userId`** (`profilePreview.service.ts:98`, `setupProgress.service.ts:1332`).
  - **Auth after data access** (approve/reject/reset).
  - **Errors as 500s** (21 of 23 admin routes), and error messages returned to clients (`register-async:148-155`).
  - **Fail-open security controls:** rate limit on error, CAPTCHA when the token is missing or the secret unset, lockout when Redis is unset.
  - **Secrets and credentials in caches** (`passwordHash` in Redis).
  - **Fire-and-forget side effects** on serverless.
  - **`ignoreBuildErrors` in production builds.**
