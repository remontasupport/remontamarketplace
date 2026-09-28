# Working in this repository

## The one thing to know first

**`main` is production for BOTH products.** A merge deploys the application
(`app.remontaservices.com.au` + 3 domains) and the marketing site at the same time.
There is no staging branch.

**Never push to `main` directly.** Always branch → PR → verify → merge.

---

## The process

### 1. Branch

```bash
git checkout main && git pull
git checkout -b <type>/<short-name>      # fix/… feat/… u9/… 
```

### 2. Verify locally, before pushing

```bash
pnpm --filter @remonta/app run quality     # 149 type · 518 lint · 54 tests
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
plus both Vercel previews.

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

## Rollback

Promote the last known-good deployment in Vercel. Seconds, no rebuild.

| Project | Deployment |
|---|---|
| `remonta-app` | `izjuyh7pl` |
| `remontamarketplace` | `8843hlhft` |

Re-record these before any unit that changes deployment settings. **Promote a
deployment; do not redeploy a commit** — a rebuild can fail, an existing build cannot.

---

## apps/api: the backend service (local and CI only until AWS)

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

## AI-DLC

This project follows the AI-DLC workflow in `aidlc-docs/`. Unit plans, summaries and
the audit trail live there. `aidlc-docs/aidlc-state.md` is the current position.

Log every user input verbatim in `audit.md` by **appending** — never rewrite it.
