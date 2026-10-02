# Requirements -- remove the legacy worker sign-up path (cut-over clean-up)

**Depth:** Standard. Deletion across two packages of a path that production no longer runs, plus a refactor of files
the live api path shares. **Sources:** the request (audit, 2026-10-02), `legacy-signup-removal-inventory.md`,
`legacy-signup-removal-questions.md` and `legacy-signup-removal-clarification.md` (answers Q1 = B, Q2 = A, Q3 = A,
Q4 = B; clarification A: "A, but make sure the production api still works 100%").

## 1. Intent analysis

| | |
|---|---|
| **User request** | "delete the legacy api in sign up workflow and the connected codes of it since the new backend api is already deployed. Make sure to be careful when deleting" |
| **Request type** | Technical debt removal (follow-up 3 of the state file) |
| **Scope estimate** | Multiple components: `apps/app` (page, routes, helpers, glue, adapters, tests, docs), `packages/form-engine` (legacy mode), CLAUDE.md and `docs/signup` |
| **Complexity estimate** | Moderate: the deletions are mechanical; the engine refactor touches files the live path shares, so the test and preview protocol carries the risk |

## 2. Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Delete everything in inventory section A; keep everything in section B | inventory |
| D2 | Remove legacy mode from the form engine too: `Backend` becomes api-only, `Mode`, `LegacyAdapter` and every `legacy` branch go | Q1 = B, clarification A |
| D3 | When `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is missing, the sign-up page renders a short "temporarily unavailable" card and logs the missing variable on the server | Q2 = A |
| D4 | Proceed now; rollback = Vercel promote of the previous `remonta-app` deployment, and the api's own revisions | Q3 = A |
| D5 | Extensions: Security yes (blocking), Resiliency yes (blocking), PBT no | Q4 = B |
| D6 | "Production still works 100 %": the api path must be byte-for-byte the same request to the same endpoints, proven by the existing contract tests, a full preview sign-up and a production check after merge (§5) | clarification |

## 3. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | `/registration/worker` renders the api-mode wizard whenever the two public variables are set; no code path can render the pre-S1 page any more | Must |
| FR-02 | With a variable missing, the page renders the "unavailable" card (title, one sentence, no form) and `console.error`s which variable is missing. Production has both variables, so production users never see it | Must |
| FR-03 | The routes `POST /api/auth/register-async` and `POST /api/auth/check-email` no longer exist (404) | Must |
| FR-04 | The api-mode request body, endpoints, validation rules, reCAPTCHA actions, photo staging, email-code flow, draft behaviour and success redirect are unchanged | Must |
| FR-05 | The Upstash key `switch:registration` and the env var `REGISTRATION_BACKEND` are no longer read anywhere | Must |
| FR-06 | Shared code in inventory section B keeps working: `/api/suburbs`, `/api/upload/worker-photo`, `PhotoUpload`, the category dialog and hook, client/coordinator registration, the success page, the api's legacy-column dual write | Must |
| FR-07 | `lib/auth-prisma.ts` no longer omits the three S1 columns | Should |
| FR-08 | CLAUDE.md, `docs/signup/*` and the state file describe the system without the switch and the legacy page | Must |

## 4. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | **No new dependency; no contract, api, schema or infra change.** `packages/form-engine` keeps P-7 (no DOM) |
| NFR-02 | **Zero dangling references**: after the change, `rg` finds no import of a deleted module and no `legacy`/`mode` branch in the sign-up code |
| NFR-03 | **Baselines**: the app's type and lint baselines may only shrink (deleted files remove known findings); any new finding fails the gate |
| NFR-04 | **Rollback** (D4) documented in the PR; the current production deployment id noted by the user before merge |
| NFR-05 | **Manual clean-up after merge** (user): delete the Upstash key; remove `REGISTRATION_BACKEND` from Vercel Preview |

## 5. Verification protocol ("production still works 100 %")

1. **Gates**: `@remonta/form-engine`, `@remonta/app`, `@remonta/api-contract` quality; CI's turbo build and both Vercel previews.
2. **Static proof**: `rg` for every deleted module path, `register-async`, `check-email`, `registration-switch`,
   `REGISTRATION_BACKEND`, `switch:registration`, `mode === "legacy"`, `LegacyAdapter`, `legacyShape` returns nothing outside
   `aidlc-docs/` and the audit.
3. **Request equality**: the existing tests "api mode sends the contract's body" and "what the form accepts, the
   contract accepts" pass unchanged in their expectations.
4. **Preview** (staging api): the wizard renders; suburb search returns rows with ids; email code sent and verified;
   photo staged; sign-up with an internal address accepted (success page); the two deleted routes return 404; one
   dashboard flow that uses `/api/suburbs` and one that uses `/api/upload/worker-photo` still work.
5. **Production after merge**: the sign-up page renders the wizard; suburb search works; optionally one internal
   sign-up; the deleted routes return 404. If anything is wrong: Vercel promote of the previous deployment.

## 6. Extension compliance (Requirements stage)

- **Security**: removing `check-email` removes an endpoint that revealed whether an address is registered (an
  improvement); removing `register-async` removes a second write path to `users`. No new endpoint. N/A elsewhere.
- **Resiliency**: inherits S1's targets and processes; the instant `legacy` rollback is replaced by Vercel promote
  (D4, user decision). The "unavailable" card (D3) is the graceful degradation for a misconfigured deployment.
- **PBT**: not enabled this cycle (D5). The engine's existing property-based tests stay and must pass.

## 7. Out of scope

The api's dual write of the legacy columns and the search readers (follow-up 1); the CRM notification (follow-up 2);
the client and coordinator registration routes; the other hand-built forms.
