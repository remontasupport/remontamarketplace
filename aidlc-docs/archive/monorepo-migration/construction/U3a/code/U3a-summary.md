# U3a — OTP Signing Consolidation: Implementation Summary

**Unit**: U3a (Phase A, inserted between U2 and U3)
**Date**: 2026-09-10
**Branch**: `app/main`
**Scope**: Tier 2 (S1=B) — consolidation, secret, timing-safe comparison, secure code generation
**Status**: **COMPLETE and VERIFIED** — OTP round trip confirmed working on the `remonta-app` preview, 2026-09-10

---

## 1. What Changed

| File | Action |
|---|---|
| `src/lib/otp.ts` | **Created** — `signOtpToken`, `verifyOtpToken` |
| `src/lib/otp.test.ts` | **Created** — 13 tests |
| `src/lib/password.test.ts` | **Created** — 6 tests |
| `src/app/api/auth/send-otp/route.ts` | Modified — imports the shared signer; local copy deleted |
| `src/app/api/auth/verify-otp/route.ts` | Modified — imports the shared verifier; local copy deleted |
| `src/lib/password.ts` | Modified — `Math.random()` → `crypto.randomInt()` |
| `src/utils/serviceSlugMapping.test.ts` | Modified — corrected a faulty oracle (see §5) |

**This is the first unit that changes runtime code.** U1 and U2 could not affect production; this
one is on the client registration path.

---

## 2. The Four Fixes

### F-1 — Duplication removed

`signOtpToken` existed twice, as byte-identical copies in each OTP route, with nothing binding
them. If either had drifted, every verification would have failed and no client could register.

Now one implementation in `src/lib/otp.ts`, imported by both. This also clears the type error that
prompted the unit: a Next route module may only export HTTP handlers, and `send-otp` was exporting
a helper. **Both routes now export only `POST`** — confirmed, and the `.next/types` error is gone.

### F-2 — Hardcoded fallback secret removed

Was:

```ts
const SECRET = process.env.NEXTAUTH_SECRET ?? 'remonta-otp-secret';
```

The OTP scheme is stateless — the HMAC goes to the client and comes back — which is sound *only
while the secret is secret*. With `NEXTAUTH_SECRET` unset, the secret became a string published in
this repository, so anyone could compute the HMAC for all 1,000,000 six-digit codes offline and
bypass verification entirely. It failed **open**, and silently.

It now throws.

**Implementation note on S2**: the secret is resolved **lazily on first use**, not at module load.
S2 asked for a loud failure and that is what this does — but a module-load throw would also fail
`next build`, which evaluates route modules for static analysis. If `NEXTAUTH_SECRET` were absent
from a build environment, a safety fix would have become an outage. Lazy resolution fails before
any token is signed or checked, which is the property that matters, without that risk.

### F-3 — Codes now from a CSPRNG

`Math.random()` → `crypto.randomInt(100000, 1000000)`. These codes are credentials;
`Math.random()` is not cryptographically secure and its output is predictable from prior values.
The upper bound is exclusive, so the range is unchanged.

### F-5 — Constant-time comparison

`expected !== token` short-circuits at the first differing byte. Replaced with
`crypto.timingSafeEqual`, length-checked first because `timingSafeEqual` throws on length mismatch
— which would itself leak timing.

### Not done — F-4, rate limiting

Deferred to **U14** by the Tier 2 decision, where `/api/upload/worker-photo` needs the same
treatment (FR-5.4). Both OTP routes remain unlimited: a six-digit code with a 15-minute window and
no attempt counter is brute-forceable online, and `send-otp` can be used to send unbounded email
to any address. **This is still open.**

---

## 3. How Lock-Out Was Prevented

The real risk in this unit is subtle: tokens issued before the change are in users' inboxes for up
to 15 minutes. If the extracted signer disagreed with the original by one byte, every one of them
would fail and no client could complete registration.

`src/lib/otp.test.ts` therefore contains the **pre-extraction implementation, copied verbatim**,
and asserts the new function against it:

```ts
fc.assert(fc.property(email, code, expiresAt, (e, c, x) => {
  expect(signOtpToken(e, c, x)).toBe(originalSignOtpToken(e, c, x));
}));
```

That duplication is deliberate and must stay — it is the pin that stops the token format drifting.

---

## 4. Tests Added — 19

**`otp.test.ts` (13)**: compatibility with the original implementation, both by example and as a
property; 64-char lowercase hex shape; determinism; sensitivity to each of email, code and expiry
independently; `verifyOtpToken` accepting its own output; rejection of same-length tampered
tokens (which specifically exercises the `timingSafeEqual` path rather than the length check);
rejection of wrong-length and non-string candidates without throwing.

The expiry-sensitivity test matters more than it looks: the client supplies `expiresAt` back on
verification, and it is only safe to trust because it is covered by the HMAC.

**`password.test.ts` (6)**: 10,000 generated codes are all exactly six digits and within
100000–999999 — enough draws to catch an off-by-one at either bound, since `randomInt`'s upper
bound is exclusive; no leading zeros; no stuck generator; expiry honours the requested minutes.

---

## 5. A Flaky Test From U2, Found and Fixed

Running the suite after this unit's changes **failed a U2 test** that had passed before:

```
isServiceInDatabase > agrees with the mapping table for arbitrary input
Counterexample: ["toString"]
```

**The implementation was right; my test was wrong.** `isServiceInDatabase` uses
`Object.values(...).includes(...)`, which sees only own values. My oracle used
`candidate in SERVICE_NAME_TO_SLUG`, and `in` walks the prototype chain — so
`"toString" in SERVICE_NAME_TO_SLUG` is `true` while the function correctly returns `false`.

The U2 run passed **by luck**: fast-check draws a different seed each run, and that one never
generated `"toString"`. The suite was not deterministic, and the U2 summary's "21 tests pass"
was true but not robust.

Fixed by using `getAllServiceNames()` as the oracle, plus an explicit regression test asserting
`false` for `toString`, `constructor`, `valueOf`, `hasOwnProperty`, `__proto__`, `isPrototypeOf`
and `propertyIsEnumerable`. That guard is worth having independently: if anyone rewrites the
predicate as `name in SERVICE_NAME_TO_SLUG` or `!!SERVICE_NAME_TO_SLUG[name]`, a caller could
start treating `"constructor"` as a real service.

This is property testing doing its job — including on the person writing the property.

---

## 6. Verification Performed

| Check | Result |
|---|---|
| `npm test` | **41 passed**, 4 files ✅ |
| Compatibility property vs original implementation | ✅ |
| Type baseline | 149 unchanged, exit 0 ✅ |
| Lint baseline | 523 unchanged, exit 0 ✅ |
| `npm run build` | **succeeds** ✅ |
| `send-otp` type error in `.next/types` | **gone** ✅ |
| Both routes export only `POST` | ✅ |
| `remonta-otp-secret` anywhere in `src/` | only in a comment recording its removal ✅ |
| `Math.random` in `password.ts` | only in a comment ✅ |

Baseline counts did not move because the `.next/types` error was excluded from collection by U2's
determinism fix, so it was never counted. It is nonetheless genuinely resolved.

---

## 7. ✅ Preview Verification — DONE (2026-09-10)

**The OTP round trip was exercised on the `remonta-app` preview and works as expected**: a code was
requested from the client registration form, received by email, and accepted on entry.

No automated test covers the full path through the routes — the tests pin the signing function,
not the HTTP flow, the email delivery or the client component. This is the PS-2 check that matters
for this unit, and it is the only one that would catch a wiring mistake between the routes and the
new module.

**Also confirm `NEXTAUTH_SECRET` is present in the Preview environment** in Vercel. If it is
Production-only, the OTP routes will now throw on the preview — which is the fix working as
designed, but easy to misread as a regression.

---

## 8. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps build and deploy | ✅ `app/main` verified; marketing untouched by this unit |
| **PS-2** Preview-verified | ✅ **DONE 2026-09-10** — OTP round trip exercised on the `remonta-app` preview; code sent, received and accepted |
| **PS-3** Single `git revert` | ✅ One new module, two routes, one helper, three test files |
| **PS-4** Additive before subtractive | ⚠️ Partial — local copies deleted in the same change that adds the shared module. Splitting would have left two signers, which is the problem being fixed. The compatibility property test is the compensating control. |
| **PS-5** No destructive DB change | ✅ N/A |
| **PS-6** Not both structure and behaviour | ⚠️ **Deliberately** — this unit changes behaviour by design, and contains no structural moves in exchange |
| **PS-7** Integrations disabled before removal | ✅ N/A |

---

## 9. Follow-ups

| Item | Where |
|---|---|
| **Rate limiting on both OTP routes (F-4)** | **U14** — still open |
| Verify the OTP round trip on a preview | Before merge |
| Confirm `NEXTAUTH_SECRET` is set for Preview in Vercel | Before merge |
| Wire `npm run quality` into CI | **U3** |
