# U3a — OTP Signing Consolidation: Code Generation Plan

**Stage**: CONSTRUCTION — Code Generation (Part 1: Planning)
**Unit**: U3a — OTP signing consolidation *(inserted unit, Phase A)*
**Date**: 2026-09-10
**Status**: APPROVED (S1=B, S2=A) and COMPLETE 2026-09-10. Pending preview verification of the OTP round trip.

---

## 1. Why This Unit Exists

U2's verification surfaced a type error: `src/app/api/auth/send-otp/route.ts` exports
`signOtpToken`, and Next.js route modules may only export HTTP handlers and a fixed set of config
values. Fixing that export is a one-word change.

Reading the surrounding code to make that change found more. This plan reports all of it, and asks
you to choose how much to fix in one unit — PS-6 exists to stop units sprawling, and this one
could.

---

## 2. Findings

### F-1 — The function is duplicated, not shared *(Medium)*

| Location | Form |
|---|---|
| `send-otp/route.ts:9` | `export function signOtpToken(...)` |
| `verify-otp/route.ts:6` | `function signOtpToken(...)` — private copy |

They are byte-identical today. **Nothing imports the exported one.** Two copies of an HMAC signer
that must agree exactly: if either changes, every OTP verification fails, and nothing — no test, no
type, no import — binds them together.

The `export` is also what causes the type error, since nothing consumes it.

### F-2 — Hardcoded fallback secret *(High if it ever fires; currently dormant)*

Both files:

```ts
const SECRET = process.env.NEXTAUTH_SECRET ?? 'remonta-otp-secret';
```

This is worse than ordinary bad practice, because of how the OTP scheme works. The design is
stateless: `send-otp` returns `token = HMAC(email:code:expiresAt)` **to the client**, and
`verify-otp` recomputes it. That is sound *provided the secret is secret* — an attacker holding
the token cannot brute-force the code offline without it.

If `NEXTAUTH_SECRET` is ever unset or misnamed, the secret becomes a string published in this
repository. An attacker can then compute the HMAC for all 1,000,000 six-digit codes offline and
**bypass verification entirely**.

It fails **open** and **silently**. `NEXTAUTH_SECRET` is set today, so this is dormant — but it is
one misconfiguration from total bypass. SECURITY-12 (no hardcoded credentials), SECURITY-15 (fail
closed).

### F-3 — Codes come from `Math.random()` *(Medium)*

`src/lib/password.ts:107`:

```ts
const code = Math.floor(100000 + Math.random() * 900000).toString();
```

`Math.random()` is not cryptographically secure and its output is predictable from prior values.
For a credential — which is what a verification code is — `crypto.randomInt()` is the correct
source and is a drop-in replacement.

> Note: `generateVerificationCode` is used by other flows too, so this change reaches beyond the
> OTP routes. That is why it is a separate scope tier below.

### F-4 — No rate limiting on either OTP route *(Medium)*

Neither `send-otp` nor `verify-otp` applies a limiter, and `verify-otp` keeps no server-side
attempt counter — it is stateless by design.

A six-digit code is 1,000,000 possibilities with a 15-minute window. Online brute force is
feasible with no limiter in the way. `send-otp` is also unlimited, so it can be used to send
unbounded email to any address.

The infrastructure already exists — `src/lib/ratelimit.ts`, used by `/api/contractors`.
NFR-3.4 and SECURITY-11 both require it on public endpoints.

### F-5 — Timing-unsafe HMAC comparison *(Low)*

`verify-otp/route.ts:33`:

```ts
if (expected !== token) { ... }
```

String `!==` short-circuits on the first differing byte. `crypto.timingSafeEqual` is the standard
remedy. Severity is low here — the attacker would need to already hold a valid token — but it is a
two-line fix in code being touched anyway.

---

## 3. Scope Decision

**Tier 1 — the original unit** *(recommended minimum)*
- F-1: extract to `src/lib/otp.ts`, both routes import it, delete both local copies
- F-2: remove the fallback; throw if `NEXTAUTH_SECRET` is absent
- Property tests for the signer
- **Clears the type error that prompted this unit**

**Tier 2 — Tier 1 plus the cheap hardening in the same code** *(recommended)*
- F-5: `timingSafeEqual` comparison
- F-3: `crypto.randomInt` for code generation

**Tier 3 — Tier 2 plus rate limiting**
- F-4: limiters on both OTP routes

### Question S1
Which tier?

A) **Tier 1** — consolidation and the secret only

B) **Tier 2** — plus timing-safe comparison and secure code generation

C) **Tier 3** — plus rate limiting

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **Recommendation: B.** Tier 1 leaves `Math.random()` generating credentials, which is a real
> weakness sitting in the same flow, and both additions are small and self-contained. Tier 3's
> rate limiting is worth doing but has a different shape — it needs limiter tuning and touches
> request handling rather than the signing logic — so it fits better alongside U14's other
> security work, where `/api/upload/worker-photo` already needs the same treatment (FR-5.4).
>
> If you prefer Tier 3 anyway, say so; it is defensible to close the whole surface at once.

### Question S2
Removing the fallback means the app **throws at startup** if `NEXTAUTH_SECRET` is missing, rather than silently signing with a known value. Confirm that is wanted?

A) **Yes — fail loudly.** A missing auth secret should stop the app, not degrade it silently.

B) No — log an error and continue with a generated per-process secret instead.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** `NEXTAUTH_SECRET` is already required by NextAuth itself, so the app is
> non-functional without it regardless. Failing at startup makes that explicit instead of leaving
> a forgeable-token path open. Option B is worse than it sounds: a per-process secret would break
> verification across serverless instances, since `send-otp` and `verify-otp` may land on
> different ones.

---

## 4. Per-Unit Stage Assessment

| Stage | Decision | Rationale |
|---|---|---|
| **Functional Design** | **SKIP** | No new business logic. Behaviour is preserved exactly, apart from the deliberate startup failure in S2. The design is stated in this plan. |
| **NFR Requirements** | **SKIP** | The applicable NFRs already exist — NFR-3.1, NFR-3.5, SECURITY-12, SECURITY-15. Nothing new to determine. |
| **NFR Design** | **SKIP** | No new patterns. |
| **Infrastructure Design** | **SKIP** | No deployment or resource change. |
| **Code Generation** | **EXECUTE** | Always. |

---

## 5. Unit Context

- **Phase**: A — inserted between U2 and U3
- **Depends on**: U2 (test framework needed for the property tests)
- **Blocks**: nothing — U3 could run first if preferred
- **Traces to**: TD-1-adjacent, SECURITY-12, SECURITY-15, NFR-3.1, NFR-3.5, PBT-03
- **Production risk**: **Low, but not zero** — unlike U1 and U2, this unit **changes runtime code** on the registration path.

### Why this is not a zero-risk unit

U1 and U2 could not break production because neither altered anything reachable at runtime. U3a
does. The OTP flow is on the client registration path, and if the extracted signer disagrees with
the old one by even one byte, **every OTP verification fails** and no client can register.

Mitigation: the signing input string (`${email}:${code}:${expiresAt}`) and algorithm are moved
**verbatim**, and a property test asserts the extracted function reproduces the original
implementation's output across generated inputs. Step 4 makes that explicit.

---

## 6. Generation Steps

### Step 1 — Create `src/lib/otp.ts`
- [x] `signOtpToken(email, code, expiresAt)` — HMAC input and algorithm copied **verbatim**
- [x] Secret resolved lazily on first use (not module load — see summary); **throw** if `NEXTAUTH_SECRET` is absent (S2)
- [x] *(Tier 2)* `verifyOtpToken(...)` using `crypto.timingSafeEqual`, length-checked first
- **Traces to**: F-1, F-2, F-5

### Step 2 — Update `send-otp/route.ts`
- [x] Import from `@/lib/otp`; deleted the local copy and its `export`
- [x] Confirmed — exports only `POST`
- **Traces to**: F-1, and the type error that prompted this unit

### Step 3 — Update `verify-otp/route.ts`
- [x] Import from `@/lib/otp`; deleted the local copy
- [x] *(Tier 2)* replaced `expected !== token` with the timing-safe comparison
- **Traces to**: F-1, F-5

### Step 4 — Write `src/lib/otp.test.ts`
- [x] **Compatibility property**: for generated email/code/expiry triples, the extracted signer produces exactly what the original inline implementation produced. This is the test that proves no user is locked out.
- [x] Determinism: same inputs always give the same token
- [x] Sensitivity: changing any one of email, code or expiry changes the token
- [x] *(Tier 2)* `verifyOtpToken` accepts a matching token and rejects a mismatched one of equal length
- **Traces to**: NFR-5.2, PBT-03

### Step 5 — *(Tier 2)* Secure code generation
- [x] `src/lib/password.ts`: `Math.random()` → `crypto.randomInt(100000, 1000000)`
- [x] Property test: 10,000 generated codes are all exactly 6 digits and within range
- **Traces to**: F-3

### Step 6 — Verify
- [x] `npm test` passes — 41 tests
- [x] `npm run quality` — type baseline should **drop below 149** once the export is gone; tighten the baseline and record the new count
- [x] `npm run build` succeeds
- [x] Confirmed `.next/types` no longer reports the `send-otp` error

### Step 7 — Manual verification note
- [x] Recorded in the summary that the OTP flow **must be exercised on a preview deployment** — request a code, receive the email, verify it — because no automated test covers the full round trip through the routes
- **This is the PS-2 check that matters most for this unit**

### Step 8 — Documentation
- [x] `aidlc-docs/construction/U3a/code/U3a-summary.md`

---

## 7. Production-Safety Protocol

| Invariant | How U3a satisfies it |
|---|---|
| **PS-1** Both apps build and deploy | Step 6 |
| **PS-2** Preview-verified | **Critical here** — the OTP round trip must be exercised manually (Step 7) |
| **PS-3** Single `git revert` | One new file, two modified routes, one modified helper |
| **PS-4** Additive before subtractive | Partially — the local copies are deleted in the same commit that adds the shared module. Splitting them would leave two signers where the point is to have one. The compatibility property test (Step 4) is what makes this safe. |
| **PS-5** No destructive DB change | N/A |
| **PS-6** Not both structure and behaviour | **Deliberately violated, narrowly.** This unit changes behaviour by design. It contains no structural moves in exchange. |
| **PS-7** Integrations disabled before removal | N/A |

---

## 8. Summary

**8 steps.** One new module, two routes updated, one helper hardened, one test file.

**Two decisions needed**: the scope tier (S1 — recommend **B**), and confirmation that a missing
`NEXTAUTH_SECRET` should **fail loudly** (S2 — recommend **A**).

**This is the first unit that touches runtime code.** The compatibility property test in Step 4 is
the safeguard, and the OTP round trip must be exercised on a preview before this reaches
production.

**Estimated scope**: half a day to a day.
