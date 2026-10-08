# Functional Design Plan -- unit `api-identity` (U1)

**Inputs:** requirements FR-ID-01..06, FR-PLT-01/02, NFR-03/04/06/07/09; stories US-AS-08, 09, 10, 14, 17, 18;
application design C1, C3, C4, C10 (the pipeline's log bindings), C11, C12, C15; the reverse-engineering facts:
the NextAuth JWT session carries `id`, `role`, `email`, `impersonatedBy` and is read server-side with `getSession()`;
the api's `Authenticator` port and pipeline step 5; `jose` available (declared directly by both apps).

Scope of this unit: the token's claims and lifetime, the minter, the verifier, the client's token source, the
attributed log line, the auth-failure signal. The secret's provisioning is Infrastructure Design; limit values,
rotation and the alert threshold are NFR Requirements and NFR Design.

Three decisions are open. Each is pre-filled with a proposal; leave or change the letter and say "approved" (or
"done").

## Question 1
Token lifetime (NFR-03 says at most 10 minutes).

A) **5 minutes**, renewed by the client 60 s before expiry. A suspended or signed-out admin keeps api access for at
most 5 minutes; a token route call happens about every 4 minutes per open admin tab. Recommended.

B) **10 minutes**, the maximum the requirement allows; half the token-route traffic, twice the lag.

C) **2 minutes**; the smallest lag; a token-route call about every minute per tab.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
What the minter checks beyond the session. The NextAuth session can outlive a suspension (the app's own 60-minute
login cache is a known issue, `.brd` J7.4). The token route could read the account's current status before
minting, at the cost of one indexed read per mint (about every 4 minutes per tab).

A) **Read the account before minting.** `users.status` and `role` are read by id; a suspended account, or a role
that no longer matches the session's, gets 401 and no token. The api's lag then equals the token lifetime only;
nothing is minted for a suspended admin. Recommended: cheap, and it closes the gap the login cache leaves.

B) **Session only.** The claims come straight from the session; the lag is the session's lifetime plus the
token's. Simpler; relies on the app's suspension handling, which is known to lag up to an hour.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The impersonation claim (US-AS-10). When an admin impersonates a worker the session's `user` is the worker and
`impersonatedBy` is the admin's id.

A) **Subject = the impersonated user, role = their role, `act` = the admin's id.** The api treats the request as the
worker's (403 on admin entries), logs both ids, and any later worker-facing entry sees the worker as the principal
with the admin recorded. Recommended: impersonation never widens rights, and the audit names both (S1 FR-ID-07).

B) **Refuse to mint during impersonation.** The token route answers 403 while `impersonatedBy` is set; admin
screens are unusable until impersonation ends; future worker-facing entries get no token during impersonation
either.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Design decisions that are not questions (stated so they can be objected to)

- **Claims:** `sub` (user id), `role`, `act?` (impersonator id), `iss = 'remonta-app'`, `aud = 'remonta-api'`, `iat`,
  `exp = iat + lifetime`, `jti` (random UUID). No email, no name: nothing personal travels in the token.
  Algorithm HS256; the `alg` header must equal it (no `none`, no asymmetric fallback). Secret: 32+ bytes, decoded
  from an environment variable as UTF-8 bytes on both sides.
- **Verification order (C3):** header present and `Bearer <token>` -> `jose.jwtVerify` with `{algorithms: [HS256],
  issuer, audience, clockTolerance: 30 s}` -> `apiTokenClaimsSchema.parse(payload)` -> `Principal`. The first
  failing check decides the logged reason (`missing`, `malformed`, `bad-signature`, `expired`, `not-yet-valid`,
  `bad-issuer`, `bad-audience`, `bad-claims`); the response is always 401 with the generic envelope.
- **No replay store:** `jti` is logged, not checked; the 5-minute lifetime bounds replay; a replay store is a later
  identity-slice decision (FR-ID-03).
- **The client's token source (C12):** one token in memory; `getToken()` returns it while `expiresAt - now > 60 s`;
  otherwise one fetch shared by concurrent callers; a failed fetch (401) throws `Unauthenticated`, which the admin
  client maps to the sign-in redirect; a failed fetch (5xx/network) is retried once after 1 s, then surfaces as
  `unavailable`.
- **The token route (C11):** `GET`, `no-store`, the app's `strictApiRateLimit` applied per user id; the response is
  `{token, expiresAt}`; the route never sets a cookie.
- **The attributed log (C10):** after step 5 the pipeline creates a child logger with `{userId, impersonatorId?}`
  for the rest of the request; the existing redaction paths already cover `authorization`.
- **The rejection line:** `log.warn({auth: 'rejected', reason, entry: id}, 'auth rejected')` once per rejected
  request; no token fragment, no header value.

## Execution checklist

- [x] 1. Confirm the three answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/api-identity/functional-design/business-logic-model.md`: mint, verify, renew,
  retry-on-401, the impersonation path, the suspension path; sequence diagrams
- [x] 3. `business-rules.md`: numbered rules for claims, minting (incl. the account read), verification (every
  rejection case and its reason), the client's renewal, logging; the property list (PBT-01)
- [x] 4. `domain-entities.md`: the token (claims), the principal, the token source's state; no persistence
- [x] 5. `frontend-components.md`: the token source and the admin client's auth behaviour (the screens' notices are
  U2's)
- [x] 6. Present for approval
