# My Profile api: structure and security review (2026-10-14)

Scope: every `apps/api` entry the **My Profile** pages call (PR #57's sidebar: Personal / Professional / Additional
Information), and the path from the browser to the table. Read from `main` `4434787` (api) and `feat/edit-profile-app`
`26fbb12` (app). Service Area (Services) and Bank Account (Account) live in the same contract and are included.

## 1. The entries

All are in `packages/api-contract/src/worker.contract.ts`, bound in `apps/api/src/modules/worker/worker.handlers.ts`.
Every write: role WORKER, no captcha, 60/min per user + 120/min per IP, audit `PROFILE_UPDATE` (section + profile id in
metadata), one transaction through `replaceSection`. Every read: 120/min per user + 300/min per IP, private cache 60 s + ETag.

| Page | Entry | Method / path | Body limit | Table / columns |
|---|---|---|---|---|
| (all) | getProfile | GET /v1/worker/profile | 1 KB | read of every section; bank account masked |
| Name | putName | PUT /v1/worker/profile/name | 4 KB | worker_profiles.firstName/middleName/lastName |
| Profile Photo | createPhotoTicket | POST /v1/worker/photos/tickets | 1 KB, **10/min** | nothing stored (audit skipped) |
| | confirmPhoto | POST /v1/worker/photos | 1 KB | registration_photo_uploads (claim) · worker_profiles.photos/additionalPhotos · outbox PhotoUploaded |
| | makeMainPhoto | POST /v1/worker/photos/main | 4 KB | worker_profiles.photos/additionalPhotos |
| | removePhoto | POST /v1/worker/photos/remove | 4 KB | same, then a Vercel Blob delete after commit |
| Bio | putBio | PUT /v1/worker/profile/bio | 4 KB | worker_profiles.introduction |
| Address | putHomeAddress | PUT /v1/worker/profile/home-address | 4 KB | worker_profiles.homeStreetLine/homeLocalityId |
| Date of Birth | putDateOfBirth | PUT /v1/worker/profile/date-of-birth | 1 KB | worker_profiles.dateOfBirth |
| Gender | putGender | PUT /v1/worker/profile/gender | 1 KB | worker_profiles.gender |
| Vehicle Access | putVehicle | PUT /v1/worker/profile/vehicle | 1 KB | worker_profiles.hasVehicle |
| Language + 6 Additional pages | putAdditionalInfo | PUT /v1/worker/additional-info/:group | 16 KB | worker_additional_info, the group's columns only |
| Experience | putExperience | PUT /v1/worker/experience | 16 KB | worker_experience (delete + insert) |
| Work History | putJobHistory | PUT /v1/worker/job-history | 16 KB | worker_job_history (delete + insert) |
| Education | putEducation | PUT /v1/worker/education | 16 KB | worker_education (delete + insert) |
| Preferred Hours | putAvailability | PUT /v1/worker/availability | 16 KB | worker_availability (delete + insert) |
| (Services) Service Area | putServiceArea | PUT /v1/worker/profile/service-area | 4 KB | worker_locations HOME + the legacy location columns |
| (Account) Bank Account | putBankAccount | PUT /v1/worker/bank-account | 4 KB | worker_additional_info.bankAccount (JSON) |
| (no page) | putAbn | PUT /v1/worker/profile/abn | 4 KB | worker_profiles.abn (JSON) |

The groups `good-to-know` and `fun-fact` have entries but no page in the new menu.

## 2. Structure: what holds

- **One declaration per entry, one pipeline for all** (`platform/pipeline/pipeline.ts`): IP limit -> captcha -> token ->
  role -> user limit -> strict validation -> handler -> response checked against its schema -> audit enforced -> cache.
  An entry cannot skip a step; a write without an audit action does not compile (`workerWrite`).
- **Ownership by construction**: no entry takes a user or profile id; `replaceSection` finds the profile by the token's
  `sub`. Photos act only on URLs already in the caller's own columns; another worker's upload id is 404.
- **Validation twice**: strict Zod bodies (unknown keys refused, every string bounded, lists enumerated), and the
  integrity rules (slot overlap, areas within the domain, ABN checksum, age window) re-run in the handler.
- **Output shaping**: a response with an extra field is a 500, so a column cannot leak by accident; the bank account
  leaves only masked.
- **Token**: HS256 only, issuer/audience pinned, 5-minute life, strict claims, two-key rotation, account status and role
  re-read at every mint (a suspension bites within 5 minutes); impersonation carries `act` into the audit row.
- **Logs**: ids only; names, bank fields, street line, ABN and tokens redacted; no query strings.
- **Errors**: one generic envelope; causes logged, never returned.

## 3. Findings

"Traced" = read in the code, not yet reproduced; each gets a reproduction on the dev branch before a fix.

| # | Severity | Finding | Where |
|---|---|---|---|
| F1 | **High** (traced) | **Cross-worker photo deletion.** The legacy server action `updateWorkerPhoto` (also `updateWorkerAdditionalPhotos`, `swapMainPhoto`) writes any URL to the caller's photo columns (`z.string().url()`, no host or ownership check). The api's `removePhoto` then deletes from Vercel Blob any URL in the caller's own columns. Set your photo to another worker's public Blob URL, call `removePhoto`: their photo and thumbnail are deleted. Both halves are live in production today (the action on `main`, the entry on prod revision 00009). The same action lets a worker show any external image (unchecked content, tracking) as their photo. | `apps/app/src/services/worker/profile.service.ts:191`; `apps/api/src/modules/worker/application/photos.ts` `deleteStoredPhoto` |
| F2 | **High** | **Legacy write paths still callable.** `profile.service.ts`, `additionalInfo.service.ts` (incl. `updateWorkerBankAccount`), `experience.service.ts`, `availability.service.ts` are `"use server"` modules: every exported function is a POST endpoint for any session, writing the same tables without the api's rules, audit row or role check. The api's guarantees hold only once these go. | `apps/app/src/services/worker/*.service.ts` |
| F3 | Medium | **A bank account change is silent.** A stolen or impersonated session can redirect pay with one PUT: no re-authentication, no email to the worker, and the audit row says only "putBankAccount" (no before/after, not even the last 3 digits), so an investigation cannot tell which account was set. | `sections/additional-info.ts` `writeBankAccount` |
| F4 | Medium | **Bank details stored in clear** in a JSON column (only the database's disk encryption). Every database copy (the Neon dev and rehearsal branches are full copies) carries every account number. | `worker_additional_info.bankAccount` |
| F5 | Medium | **Impersonation can write.** An admin impersonating a worker gets a WORKER token and may change name, photos, bank account. It is audited (`impersonatorId`), but no policy says whether support may write, the bank account especially. | `apps/app/src/lib/api/mint.ts`; `replaceSection` |
| F6 | Low | **Free text not uniformly cleaned.** `plainText` (bio, fun fact, street) refuses control characters; job title, company, institution, qualification, other areas, own language/interest labels, account and bank name only trim. None refuse invisible or bidi characters (U+200B, U+202E), which can spoof names and text shown to admins and clients. | `packages/api-contract/src/worker.sections.ts` |
| F7 | Low | **The profile read is cached in the browser** (`private, max-age=60`): date of birth, ABN and home address stay in the disk cache of a shared computer after sign-out. A choice between `no-store` and the 304 saving. | `workerRead()` |
| F8 | Low | **The token minter's limiter fails open** and is off without Upstash (local, possibly Preview). The api's per-user limits still apply, so the impact is small. | `apps/app/src/lib/ratelimit.ts` |
| F9 | Info | `putAbn`, `good-to-know` and `fun-fact` have no page: unused entries are attack surface. Keep (U3 needs the ABN) or remove. | contract |
| F10 | Info | `TRUST_PROXY=1` on Cloud Run: per-IP limits count the address Google's front end appends. Correct by design; confirm once on staging that a forged `X-Forwarded-For` does not change the counted IP. | `infra/lib/stages.ts` |

## 4. Recommended order

1. **F1 now**, independent of PR #57: the api deletes a Blob object only when this profile owns it (a claimed
   `registration_photo_uploads` row for this profile with that URL, or the profile's own key prefix); otherwise it
   clears the column and leaves the file. An api-only PR, a staging reproduction first, then a promotion.
2. **F2 with PR #57**: once the new pages are live, delete the legacy profile server actions (or make each refuse);
   that also closes F1's write half.
3. **F3 + F5**: a bank account change emails the worker (outbox) and records last-3 before/after in the audit; decide
   whether impersonation may write the bank account (recommended: refuse).
4. **F4**: application-level encryption of the bank account (a key in Secret Manager), with a backfill.
5. F6-F10 as small items.

## 5. Layers and helpers (asked 2026-10-14)

| Layer | Where | Shared helpers | Owns |
|---|---|---|---|
| Declaration | `packages/api-contract` | `defineContract`, `meta()`, `workerRead()`, `workerWrite(audit)`, strict Zod primitives (`trimmed`, `plainText`, `uniqueList`) | method, path, bodies, responses, every security setting |
| Binding | `platform/contract/binder.ts` | `planBindings`, `defineHandlers` | one route per entry; boot refused if an entry is unbound or a stray route exists |
| Pipeline | `platform/pipeline/pipeline.ts` | `buildRouteHandler`, `enforceLimits`, `parse` | limits, captcha, token, role, validation, output check, audit check, private cache |
| Handler | `modules/<area>/<area>.handlers.ts` | one line per entry | picks the use case; no security code |
| Application | `modules/<area>/application/` | `replaceSection` (ownership + transaction + completion + audit) | the use case |
| Domain | `modules/<area>/domain/` | pure functions (`completionOf`, `maskBankAccount`, `placePhoto`) | rules, tested without a database |
| Persistence | `modules/<area>/persistence/`, `platform/persistence/db.ts` | `writeTransaction`, Prisma | SQL and transactions |
| Platform | `platform/*` | `ApiError`, `RequestAudit`, rate limiter, JWT verifier, outbox, logger redaction, load shedder | cross-cutting services |

Security layers, outermost first: Cloud Run TLS -> load shedder -> security headers + HSTS + HTTPS only -> CORS
allow-list (no credentials) -> body size -> per-IP limit (fails closed) -> captcha (public entries) -> JWT -> role ->
per-user limit -> strict input -> ownership by token subject (`replaceSection`) -> transaction + audit row -> output
schema -> generic errors -> redacted logs. In the app, before the api: the NextAuth session -> the token minter
(account ACTIVE, role unchanged, 30/min).
