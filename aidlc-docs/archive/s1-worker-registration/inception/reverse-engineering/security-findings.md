# Security Findings in Production Code (Reverse Engineering, 2026-09-25)

These were found while mapping the in-scope domains. They are **live in production today**, independent of the new backend. The first-release stories fix all of them, but the first four are serious enough to fix now in `apps/app` as separate small changes (branch → PR → verify → merge, per CLAUDE.md).

Paths are relative to `apps/app/src/`. "Verified" = read and confirmed by the lead analyst; the rest are from agent code reading, not execution.

## Fix now (recommended hotfixes)

| # | Finding | Where | Impact | Status | Fixed by story |
|---|---|---|---|---|---|
| **H1** | **Workers' bank details returned to anyone.** `getWorkerProfilePreview(userId)` is a `"use server"` action. It accepts any user ID with no auth or ownership check, selects `workerAdditionalInfo.bankAccount` and returns it. The unprotected page `/workers/[id]/profile` calls it; the response reaches the browser even though the page doesn't render it. `lib/profileData.ts` also spreads `bankAccount` into the share-link response | `services/worker/profilePreview.service.ts:80,98-104,138,224`; `app/workers/[id]/profile/page.tsx:26`; `lib/profileData.ts:84,156-158`; `app/api/share/profile/route.ts` | BSB + account number (stored **unencrypted**, ~286 rows) exposed to any visitor who has a worker's user ID, which appears in client-facing links | **Verified** (code) | US-ONB-09, US-ONB-10 |
| **H2** | **Account takeover via initial password setup.** `/api/auth/setup-password` takes email + new password, with no token. It succeeds for an ACTIVE, unlocked WORKER still on the hard-coded default password `WelcomeRemonta` | `app/api/auth/setup-password/route.ts:23,88,115` | Anyone who knows such a worker's email can set their password and sign in as them | Agent-reported | US-ACC-02 |
| **H3** | **Unpublished workers in the public feed.** `GET /api/public/workers` (no auth; consumed by the marketing site search) filters only `user.status = ACTIVE`, not `isPublished`; the comment at `:291` claims otherwise. The client worker search has the same gap | `app/api/public/workers/route.ts:112,291`; `app/api/client/workers/route.ts:353-394`; `…/by-ids/route.ts` | Workers whose documents were never checked are shown to the public and to clients | Agent-reported | US-CMP-07, US-MIG-06 |
| **H4** | **Identity documents are public files.** Every upload uses Vercel Blob `access: "public"`; admins open raw public URLs; most delete paths leave the file reachable | `lib/blobStorage.ts:19,105`; `app/api/compliance/upload/route.ts:177`; `app/api/upload/*`; `app/api/worker/identity-documents/route.ts:172-178` | Passports, police checks and NDIS screening documents reachable by anyone with the URL, forever | Agent-reported | US-ONB-04, US-ONB-05, US-CMP-02 (a full fix needs private storage, OI-07) |

H4 can't be fully fixed without moving storage. An interim hotfix can stop new public uploads only if Vercel Blob private access is available on the current plan (to be checked).

## Also live (fixed by the new backend; lower urgency or needs design)

| # | Finding | Where | Story |
|---|---|---|---|
| M1 | Unauthenticated `POST /api/admin/fix-qualifications` bulk-rewrites requirement rows | `app/api/admin/fix-qualifications/route.ts:10` | US-MIG-07 |
| M2 | Unauthenticated `/api/upload/worker-photo`: anyone can upload 50 MB to public storage; the filename is taken from a form field | `app/api/upload/worker-photo/route.ts:13-66` | US-ONB-04 |
| M3 | Approve/reject/reset read the document **before** the auth check, which makes an existence oracle | `app/api/admin/compliance/[id]/[documentId]/{approve:25/57, reject:36/68, reset:25/48}` | US-CMP-02..05, US-ID-06 |
| M4 | Every session lasts **30 days**. The 24 h / 7 d `token.exp` is overwritten by next-auth's encoder | `lib/auth.config.ts:224-225,276-283`; `next-auth/jwt/index.js:44` | US-ID-02 |
| M5 | Suspension doesn't end sessions (no revocation; middleware doesn't check status). It isn't audited and doesn't invalidate the cache | `app/api/admin/contractors/[id]/status/route.ts:58-70` | US-ID-03 |
| M6 | Redis login cache holds `passwordHash`, status and lock fields for 1 h and isn't cleared on reset, setup, password change or email change. The old password keeps working | `lib/auth.config.ts:78-91`; `lib/redis.ts:29` | US-ID-02, US-ACC-02 |
| M7 | Lockout: non-atomic counter; **never triggers when Redis is unset**; the status check runs after the password check (reveals a correct password on suspended accounts) | `lib/auth.config.ts:112-140` | US-ACC-01 |
| M8 | CAPTCHA never runs on worker registration (the page sends no token; the route only checks `if (recaptchaToken)`; `verifyRecaptcha` passes when the secret is unset) | `app/api/auth/register-async/route.ts:57`; `lib/recaptcha.ts` | US-REG-02 |
| M9 | Email enumeration: `/api/auth/check-email` returns `{exists}` without a rate limit; registration errors echo "already exists" | `app/api/auth/check-email/route.ts:15-41`; `register-async/route.ts:148-155` | US-REG-03 |
| M10 | Email OTP is stateless: the client supplies `expiresAt`; there's no attempt limit, no single use and no rate limit | `app/api/auth/send-otp`, `verify-otp`; `lib/otp.ts` | US-ACC-03 |
| M11 | `updateUserPassword` doesn't ask for the current password, uses bcrypt cost 10, writes no audit and doesn't invalidate the cache | `services/user/account.service.ts:147-191` | US-ACC-02, US-ACC-05 |
| M12 | `getAllCompletionStatusOptimized(userId)` is an exported server action with a caller-supplied user ID and no auth check | `services/worker/setupProgress.service.ts:1332` | US-ONB-08 |
| M13 | `updateSectionCompletion` lets the client set any progress flag to any value | `services/worker/setupProgress.service.ts:33-108` | US-ONB-08 |
| M14 | 21 of 23 admin routes return 500 on a permission failure; `SUPER_ADMIN` resolves to `undefined` and compiles only because `ignoreBuildErrors: true` | `lib/auth.ts:60-90`; `next.config.ts:28` | US-ID-06 |
| M15 | `/api/worker/requirements` sends `Cache-Control: public, s-maxage=30` on a per-user response (possible CDN cross-user leak; unverified) | `app/api/worker/requirements/route.ts:188` | US-ONB-03 |
| M16 | Uploaded files are checked by declared MIME type only; there's no file-signature check | all upload routes | US-ONB-04 |
| M17 | No audit record for any compliance decision, suspension, lockout, password change or email change | see `code-quality-assessment.md` | US-AUD-01 |

## Common cause
Almost every finding has the shape NFR-ARCH-01 targets: **security is opt-in per endpoint**. Middleware skips `/api/*` and server actions entirely; each route or action must remember to check auth, role and ownership, and many don't. This is the direct evidence for a deny-by-default central pipeline in the new service.
