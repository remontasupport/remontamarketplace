# Working in this repository

## The one thing to know first

**`main` is production for BOTH products.** A merge deploys the application
(`app.remontaservices.com.au` + 3 domains) and the marketing site at the same time,
within about two minutes. Every merge is a production change.

**Never push to `main` directly.** Always branch → PR → verify → merge.

**Anything on the `apps/api` path is proven on a Preview first.** See "Preview before
production" below. Production users never see new backend code until the same commit has
passed that checklist against a staging api and a non-production database.

---

## The process

### 1. Branch

```bash
git checkout main && git pull
git checkout -b <type>/<short-name>      # fix/… feat/… u9/… 
```

### 2. Verify locally, before pushing

```bash
pnpm --filter @remonta/app run quality     # 144 type · 508 lint known · 78 tests (2026-09-30)
pnpm --filter @remonta/web run quality     # 76 lint · strict tsc
pnpm --filter @remonta/schemas run quality # P-1..P-5 boundaries
pnpm --filter @remonta/api-contract run quality  # contract checks, openapi.json drift
pnpm --filter @remonta/form-engine run quality   # form logic, P-7 boundary
pnpm --filter @remonta/api run quality           # lint · strict tsc · tests (DB tests need TEST_DATABASE_URL, below)
npx turbo run build                        # both apps
```

The api's database tests and `@remonta/db`'s need a local PostGIS (see "apps/api" below). Without
`TEST_DATABASE_URL` they are skipped, which is a weaker gate, not a passing one.

Baselines tolerate existing debt and reject anything new. A failure here is a real
regression, not noise.

### 3. Push and open a PR

```bash
git push origin <branch>
```

Compare URL — **encode slashes in branch names**, or GitHub silently compares the
wrong thing:

```
https://github.com/remontasupport/remontamarketplace/compare/main...fix%2Fmy-branch?expand=1
```

**Sanity-check before clicking Create:** the commit and file counts should match what
you changed. Hundreds of commits means the base is wrong.

### 4. Wait for CI

`App Quality`, `Web Quality`, `API Quality` (its own PostGIS service container: migrations, the
suburb list, the db, api-contract, form-engine and api gates), `Supply chain`, `Package boundaries`,
`CodeQL` and `Semgrep` (code scanning, below), plus both Vercel previews.

**Code scanning.** Two report-only scanners run on every PR and weekly, and post to Security → Code
scanning: **CodeQL** (`.github/workflows/codeql.yml`, `security-extended`, JavaScript/TypeScript and
the workflow files; exclusions in `.github/codeql/codeql-config.yml`) and **Semgrep**
(`.github/workflows/semgrep.yml`: the registry packs for this stack plus this repository's own rules
in `.semgrep/remonta.yml`; exclusions in `.semgrepignore`). A finding does not fail the check until
the backlog is triaged; the one step that does fail is `semgrep --test`, which proves each repository
rule fires on `.semgrep/remonta.ts`. Adding a convention: one rule in `remonta.yml`, one `ruleid:` line
and one `ok:` line in `remonta.ts`.

### 5. Verify the preview — this is the step that catches real problems

A green build proves compilation. It proves nothing about runtime. On the preview URL:

- **Sign in**
- **Load a page that queries the database** — a dashboard, not the landing page
- **Submit a form** if the change touches schemas or validation

Every production incident this project has had would have been caught here. A green
build with every query failing is the standard failure mode, not an unusual one.

### 6. Merge

Use **"Merge pull request"** — not Squash. Squashing collapses the commits and
destroys per-unit revert granularity.

### 7. Verify production

Same checks as the preview, on the live domain. Production has its own environment
variables; a working preview does not prove a working production.

---

## Preview before production (the `apps/api` path)

The switch `switch:registration` (Upstash) decides what production's sign-up runs:
`legacy` is the pre-S1 page itself (`features/forms/legacy/worker/`), `api` is the form
engine talking to `apps/api`. Production stays on `legacy` until the api has been proven
somewhere that is not production. The plan and its open questions:
`aidlc-docs/construction/plans/S1-preview-first-verification-plan.md`.

**The rule.** A merge to `main` may add code, but must not change what a live path does. A
live-path change sits behind a switch whose "off" is the exact old code, and the flip
happens only after the checklist below has passed on a Preview for the same commit.

**Three locks hold production on `legacy`, and they are checked, not assumed:** the api is
deployed nowhere; the Upstash key reads `legacy`; and in code, a production deployment
ignores the env var `REGISTRATION_BACKEND` (`lib/registration-switch.ts`, tested), so a
variable copied into Vercel cannot flip real users. Only a deliberate key change can.

**Where the api is tested.** Its first AWS deploy is a `staging` stack against a Neon copy
of production, never the production database. Vercel's **Preview** scope points every PR
preview at it (`REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL`, a staging reCAPTCHA
key) and at staging data. Production's scope stays as it is. No dedicated branch.

**The checklist, on the PR preview, before any production step:** sign in with a
staging-only user and open a dashboard · api health 200 through the ALB · suburb search
returns rows with ids · a photo upload · a full sign-up with an internal email (code
arrives, account created, audit row, outbox `DONE`, admin list, CRM sink payload) ·
duplicate-email notice · rollback drill (`REGISTRATION_BACKEND=legacy` renders the old
page) · and the production domain checked at the same time is unchanged. Record each run
in `aidlc-docs/construction/S1-registration/preview-verification.md`.

**Never on a preview:** production database URLs, production Upstash, the live n8n
webhook, the production Blob token. Preview-scope variables point at staging resources
or are empty.

**Production flip = the Upstash key only**, set to `api` for a short canary after the
`prod` stack is deployed and healthy with the switch off; the key back to `legacy` is the
rollback and takes effect on the next request.

---

## apps/api on Google Cloud Run (`infra/`)

Two Cloud Run services in `australia-southeast1`, both described by **one table**, `infra/lib/stages.ts`:
**staging** (`remonta-api-staging`: one always-on instance on the `rehearse-w1` Neon copy, admits
Vercel previews) and **prod** (`remonta-api`: 1–4 instances, exact origins, the full alert set).
`pnpm --filter @remonta/infra run render` turns the table into `infra/cloudrun/service.<stage>.yaml`,
which is what gets deployed; a drift test fails if the two disagree. `infra/cloudrun/bootstrap.sh`
prepares a fresh project once. Guide: `infra/README.md`; decisions: the code-generation plan §3b.

```
Quality:   pnpm --filter @remonta/infra run quality   (lint · tsc · tests · render:check, no credentials)
Deploy:    merge to main touching apps/api, packages, infra, lockfile → Actions "deploy-api" → STAGING only
Promote:   Actions → deploy-api → Run workflow → stage=prod, imageTag=<sha that passed the preview checklist>
Rollback:  the same dispatch with a previous sha; or Cloud Run → service → Revisions → route traffic back
URL:       https://remonta-api[-staging]-<project number>.australia-southeast1.run.app  (no custom hostname yet)
Health:    <url>/v1/health   (a contract `probe`: never shed, plain HTTP allowed -- Cloud Run's probes hit it)
Logs:      Cloud Logging → resource.type="cloud_run_revision" AND jsonPayload.reqId="<x-request-id>"
Secrets:   Secret Manager remonta-api[-staging]-<NAME>   (add a version, then redeploy: instances read secrets at start)
Alerts:    Cloud Monitoring policies "<service> <name>" → support@remontaservices.com.au
Pause:     gcloud run services update remonta-api-staging --region australia-southeast1 --min-instances=0 --cpu-throttling
Switch:    Upstash key switch:registration = api | legacy   (production's only path to the api; no deploy needed)
```

Rules that have earned their place:

- **Production is a promotion, never a push.** Nothing deploys `remonta-api` except a
  `workflow_dispatch` naming an image that already runs on staging.
- **Rollback = redeploy an existing image, never rebuild.** Images stay in Artifact Registry (newest 20).
- **Edit the table, not the YAML.** `service.*.yaml` is generated; the gate rejects a hand edit.
- **CPU always allocated, minimum one instance.** The outbox dispatcher and the scheduler run between
  requests; a service that scales to zero silently stops sending emails.
- **Staging's wildcards are staging's.** `https://*.vercel.app` and `*.vercel.app` (one label,
  `apps/api/src/config/hosts.ts`) exist for previews. Production values are exact.
- **The api needs no DNS.** Its `run.app` URL is called only by the app's JavaScript
  (`NEXT_PUBLIC_API_URL`); CORS and reCAPTCHA concern the app's origin, not the api's.

---

## Rollback

Promote the last known-good deployment in Vercel. Seconds, no rebuild.

| Project | Deployment |
|---|---|
| `remonta-app` | `izjuyh7pl` |
| `remontamarketplace` | `8843hlhft` |

Re-record these before any unit that changes deployment settings. **Promote a
deployment; do not redeploy a commit** — a rebuild can fail, an existing build cannot.

---

## New machine

```bash
git clone https://github.com/remontasupport/remontamarketplace.git && cd remontamarketplace
git checkout <the branch aidlc-docs/aidlc-state.md names>      # s1/infrastructure as of 2026-09-30
bash scripts/setup-new-machine.sh          # checks tools, the 3 secret files, installs, builds the local database
bash scripts/setup-new-machine.sh --verify # ... and runs every quality gate
```

The three secret files (`apps/app/.env`, `apps/app/.env.local`, `apps/api/.env`) are not in git: restore
them from the backup. Everything else, the AI-DLC record included (`aidlc-docs/`, `.aidlc-rule-details/`,
`.brd/`), is in the repository. Then open Claude Code here and say "continue the AI-DLC".

## apps/api: the backend service (local and CI only until deployed)

```bash
# A database for the tests: the same image CI uses. Once.
docker run -d --name remonta-s1-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=s1test -p 55432:5432 postgis/postgis:16-3.4
export AUTH_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/s1test DIRECT_DATABASE_URL=$AUTH_DATABASE_URL
pnpm --filter @remonta/db run migrate:deploy          # every migration, PostGIS included
pnpm --filter @remonta/db localities:refresh          # dry run: prints the plan and its hash
pnpm --filter @remonta/db localities:refresh --apply --expect=<hash>
docker exec -i remonta-s1-pg psql -U postgres -d s1test < packages/db/scripts/local/seed-catalogue.sql  # service categories

# Run it (port 4000). apps/api/.env holds the secrets and must point at the LOCAL database.
cd apps/api && pnpm run build && node --env-file=.env dist/main.js

# The tests that need the database run only when TEST_DATABASE_URL points at localhost.
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/s1test pnpm --filter @remonta/api run quality
```

- A shell variable named `AUTH_DATABASE_URL` wins over `--env-file`. Unset it before running the service.
- `pnpm run build` regenerates the Prisma client; it fails with `EPERM` while the service is running
  (the process holds the query engine). Stop the service first.
- To run `apps/app` against the same local database, override its variables on the command line -- its
  `.env` points at production: `AUTH_DATABASE_URL=… DATABASE_URL=… DIRECT_DATABASE_URL=… UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN= REGISTRATION_BACKEND=api NEXT_PUBLIC_API_URL=http://127.0.0.1:4000 npx next dev`.
- `pnpm --filter @remonta/api backfill:locations` and `backfill:onboarding`: the S1 backfills. Dry run by
  default, `--apply` to write, `--report=<file>` for the full JSON. They read `apps/api/.env`.

### Refreshing the suburb list (`au_localities`): every six months, or on request

1. Download the latest G-NAF release (GDA2020, PSV) from data.gov.au and unzip it.
2. `pnpm --filter @remonta/db localities:build --release=YYYYMM --src=<unzipped folder>` rewrites
   `packages/db/data/au_localities.csv`, its `.meta.json` (with the selection report) and `ATTRIBUTION.md`.
   Commit all three together and review the report's `primaryPostcodeFallbacks`.
3. `pnpm --filter @remonta/db localities:refresh`, against the target database, prints the plan: added,
   changed, restored, retired (with how many workers are placed at each retired suburb) and its hash.
4. `... localities:refresh --apply --expect=<hash>` applies exactly that plan, under a lock. Retired suburbs
   are never deleted, and re-running the same CSV plans nothing.

## Traps that have actually bitten

**`vercel.json` overrides `package.json`.** Both apps carry their own `buildCommand`,
and Vercel prefers it. Change one without the other and the deploy fails while
`turbo run build` passes locally. They must move together.

**`vercel.json` rejects unknown keys**, including `//` comments. `turbo.json` allows
one. Do not assume they behave alike.

**Local passing ≠ Vercel passing.** `turbo` reads `package.json`; only Vercel reads
`vercel.json` and validates its schema. Three separate failures have had this shape.

**Do not commit regenerated Prisma clients.** `prisma generate` rewrites line endings
across ~80 files with no content change. Check with
`git diff --ignore-all-space --numstat` and `git checkout --` them if empty.

**Windows `EPERM` on `query_engine-windows.dll.node`** means a process holds the
engine — usually a running dev server. Stop it, or
`pnpm install --ignore-scripts` then generate manually.

**`pnpm --filter @remonta/db test` empties `au_localities`.** Its refresh integration test
TRUNCATEs the table and leaves it empty, so every suburb lookup and every DB test in
`apps/api` fails afterwards with "no record found". Reload with
`localities:refresh --apply --expect=<hash>` (the dry run prints the hash).

**Redis caches job listings for 2 hours.** Changing job data directly in the database
shows nothing until the cache is cleared: `npx tsx scripts/clear-jobs-cache.ts`. There
is no error — just the old list.

---

## Verify claims; do not assume them

- **Check refs, not reports.** `git ls-remote origin main` after a merge. "It's merged"
  has been wrong more than once, usually because the PR was created but not merged.
- **Prove a guard fails.** A boundary rule that has never rejected anything may be
  unenforceable. One was: `packages/schemas` had no TypeScript parser, so ESLint could
  not read the files it guarded and exited 0 forever.
- **Beware checks that cannot fail.** `.catch(() => 0)` around an invalid query reports
  success. So does a cache helper that returns early when unconfigured. Both happened
  here; both read as reassurance.

---

## Layout

```
main
├── apps/app          the application    → remonta-app
├── apps/web          the marketing site → remontamarketplace
├── apps/api          the backend (NestJS + Fastify); local/CI only until AWS
└── packages/
    ├── config        tsconfig, ESLint (incl. P-1..P-7), Prettier
    ├── schemas       Zod schemas + types. NO Next/React/DOM/Prisma (P-5)
    ├── api-contract  every apps/api endpoint, declared once (P-6)
    ├── form-engine   form logic: definitions, rules, submission (P-7)
    └── db            Prisma schema + migrations
```

`apps/web` must never import `@remonta/db` or a `domain-*` package (**P-1**, **P-2**) —
marketing holds no database access. Enforced by ESLint and by manifest omission;
neither alone is sufficient.

Secrets live in `apps/app/.env` and `.env.local`, gitignored. Root-level copies are
stale leftovers from before the monorepo — ignore them.

---

## Dynamic by default: declare it once, don't hand-build it

**The preferred approach in this codebase.** A new endpoint or a new form is **data
added to a declaration**, never a new hand-written file per API or per screen. Shared
machinery is written once and reused everywhere.

### Endpoints: one contract per area (`packages/api-contract`)

- `<area>.contract.ts` lists **every** endpoint of an area as an entry: method, path,
  Zod body/query/response schemas and `meta()` security settings (access, CAPTCHA,
  rate limits, body limit, audit). There are no defaults: an entry without `access` or
  `rateLimit` does not compile.
- `apps/api` binds **one handler per entry** (`modules/<area>/<area>.handlers.ts`), and a
  single pipeline runs every entry. Never add a Nest controller (a lint rule forbids it),
  and never re-implement a limit, a CAPTCHA check or error handling in a handler.
- Clients call through `createClient(contract)`; nobody hand-writes `fetch` to apps/api.
- **Adding an endpoint:** one entry, one handler function, then a `public-endpoints.json`
  line if it is public. The service refuses to boot if any entry is unbound.

### Forms: a definition, rendered by an engine

Three layers. Keep them apart:

| Layer | Where | Holds | Never holds |
|---|---|---|---|
| **Logic** | `packages/form-engine` | field-kind rules, validation from the contract, request mapping, submission with retries, the on-device draft | React, React Native, react-hook-form, Next, Node built-ins, the server (**P-7**) |
| **UI** | `apps/app/src/components/ui/form-wizard/` | presentational components: values in, callbacks out. `FormWizardView`, and one component **per field kind** in `fields.tsx` | fetching, business rules, the form library |
| **Glue** | `apps/app/src/features/forms/` | `useFormWizard` (react-hook-form + engine), `FormWizard` (field kind → component), `adapters/` (browser storage, connectivity, reCAPTCHA, image shrink, suburb search), `definitions/` | rendering details, rules |

- **A form is a definition** (`features/forms/definitions/<form>.ts`): steps, fields
  (each of a `kind`), the contract entry it submits to, the CAPTCHA action, constants,
  and values taken from the URL. See `workerRegistration.ts`.
- **Validation comes from the contract entry's schema.** Never write a second copy of a
  rule in the page; the engine picks it from the contract so the page and apps/api
  agree. A test asserts "what the form accepts, the contract accepts".
- **Adding a form:** one definition file, plus a thin client wrapper if a server page
  renders it (see the trap below). Nothing else.
- **Adding a field kind:** a rule entry in `packages/form-engine/src/kinds.ts`, one
  presentational component in `components/ui/form-wizard/fields.tsx`, and one case in
  `FormWizard`'s `FieldSlot`. It is then available to every form.
- **Resilience comes free with the engine:**
  - every form gets retries with back-off honouring `Retry-After`, and a fresh CAPTCHA token per attempt;
  - an offline pause, and the draft on the device (mark secrets `neverSaved`);
  - server field errors are mapped back to the right step.
- **Moving a legacy form over:** give the definition a `legacy` adapter with the old
  rules and the exact old request. That keeps a switch back to legacy a true rollback.
- **Existing hand-built forms** (8 suburb pickers, 11 multi-step pages) move onto the
  engine one at a time. Don't add new ones.

### Checks that enforce it

- `defineForm` throws at import if a field, constant or URL value is not in the
  contract entry's body, or if a field appears twice.
- **P-6** (api-contract) and **P-7** (form-engine) are lint rules, each with a test
  proving it rejects. A boundary rule that has never failed may be unenforceable.
- The contract checks (`checkContracts`) run in tests and at apps/api boot.

### Trap: definitions cannot cross the Server/Client boundary

A definition holds functions (the legacy adapter), and Next cannot pass functions from
a Server Component to a Client Component. Typecheck does not catch it; it crashes at
runtime. The server page passes **only data** (the backend), and a `"use client"`
wrapper imports the definition (`WorkerRegistrationWizard.tsx`).

---

## Reference docs

**Worker sign-up** — the flow, every api endpoint (parameters, responses, errors, limits), the tables
and columns it writes, the enums, and the emails/outbox/jobs: `docs/signup/README.md` (an index; start
there). Written from the code; when you change the sign-up, its contract or its tables, update the matching
file in the same PR.

---

## AI-DLC

This project follows the AI-DLC workflow in `aidlc-docs/`. Unit plans, summaries and
the audit trail live there. `aidlc-docs/aidlc-state.md` is the current position.

Log every user input verbatim in `audit.md` by **appending** — never rewrite it.
