# The admin api

How `apps/app`'s admin screens talk to `apps/api`. Written from the code; when the token, an entry or a limit
changes, update this file in the same PR. Design record: `aidlc-docs/construction/api-identity/` (the token) and
`aidlc-docs/construction/admin-search/` (the entries).

## 1. The token

Every role-restricted entry of the api needs `Authorization: Bearer <token>`. The token is a JWT the app mints
from the admin's signed-in session; the api verifies it on every request and never touches the database to do so.

| | |
|---|---|
| Minted by | `apps/app`, `GET /api/auth/api-token` (needs the NextAuth session; reads the account's current status and role first; answers 401 for a suspended account or a changed role) |
| Claims | `sub` (user id), `role`, `act` (the impersonating admin's id, during impersonation), `iss = remonta-app`, `aud = remonta-api`, `iat`, `exp`, `jti`. No name, no email. |
| Lifetime | 5 minutes (`API_TOKEN_TTL_S` in `packages/api-contract/src/auth.ts`); the app renews a minute before expiry |
| Algorithm | HS256 with a shared secret per stage: `API_TOKEN_SECRET` in Secret Manager (`remonta-api[-staging]-API_TOKEN_SECRET`) and in Vercel (`remonta-app`: Production = prod's value, Preview = staging's value). A mismatch shows as `bad-signature` rejections and, on production, the `auth-failed` alert. |
| Header | `kid: current` (or `previous` during a rotation: the api accepts both, see `infra/README.md`) |
| Verified by | `apps/api/src/platform/auth/jwt-authenticator.ts`: signature, algorithm, issuer, audience, expiry and not-before (30 s tolerance), then the strict claims schema |
| Transport | the header only; never a cookie, never a query string, never browser storage |

**Rejections.** Every refusal is a plain 401 (`{error: {code: 'UNAUTHENTICATED', ...}}`) and one warn line in the
api's log: `{auth: 'rejected', reason}` with `reason` one of `missing`, `malformed`, `bad-signature`, `expired`,
`not-yet-valid`, `bad-issuer`, `bad-audience`, `bad-claims`. The reason is never in the response.

**Impersonation.** While an admin impersonates a worker, the token's subject is the worker with the worker's role
and `act` names the admin; admin entries answer 403 and the log line carries both ids. Impersonation never widens
rights.

**Lags, stated.** After a suspension, a role change or a sign-out, an already issued token is honoured until its
expiry (at most 5 minutes); no new token is minted for a suspended account from the next renewal on.

### Minting a token by hand (staging checklist)

With the **staging** value of `API_TOKEN_SECRET` in `$SECRET` and an admin's user id in `$SUB`:

```bash
node -e '
const { SignJWT } = require("jose");
const now = Math.floor(Date.now() / 1000);
new SignJWT({ sub: process.env.SUB, role: "ADMIN", iss: "remonta-app", aud: "remonta-api", jti: require("crypto").randomUUID() })
  .setProtectedHeader({ alg: "HS256", typ: "JWT", kid: "current" })
  .setIssuedAt(now).setExpirationTime(now + 300)
  .sign(new TextEncoder().encode(process.env.SECRET)).then(console.log)'
```

Then `curl -H "Authorization: Bearer <token>" https://remonta-api-staging-<project number>.australia-southeast1.run.app/v1/admin/workers?page=1`.
A tampered token (change one character) must answer 401 and leave a `bad-signature` line in Cloud Logging.

### Reading the logs

```
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.auth="rejected"
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.auth="rejected" AND jsonPayload.reason="bad-signature"
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.userId="<user id>"
```

Every request made with a valid token carries `userId` (and `impersonatorId` when impersonating) on its log lines.

### Rotating the secret

`infra/README.md`, "The api token secret": three steps, no downtime, the previous value accepted for one lifetime.

## 2. Entries

Filled in by the admin search unit (PR 2): `GET /v1/admin/workers`, `GET /v1/admin/users`,
`GET /v1/admin/workers/suspended`, their parameters, responses, errors, limits and caching.
