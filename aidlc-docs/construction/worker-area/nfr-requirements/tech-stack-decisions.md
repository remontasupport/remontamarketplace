# Tech Stack Decisions -- unit `worker-area` (U1)

| # | Decision | Choice | Why | Alternative not taken |
|---|---|---|---|---|
| T1 | Load tool | **`autocannon`** (dev dependency of `apps/api`, pinned exact version), driven by `scripts/load-worker.ts` (tsx), which mints tokens with `jose` (already a dependency), builds the request mix and reads autocannon's per-request results | runs wherever `pnpm` runs; one language; no binary to install on the machine or in CI | k6 (separate binary, its own runtime); the api's existing paced replay script (admin-only, not a load generator) |
| T2 | Transactions and timeouts | Prisma interactive `$transaction` with `SET LOCAL statement_timeout = 5000` via `Prisma.raw` of a clamped integer (the admin search's pattern), ReadCommitted | one connection for the whole read; the timeout bounds the pool hold | `unitOfWork` (write-oriented; the read needs the timeout) |
| T3 | Profile read shape | Prisma `findUnique` with nested `select`/`include` for the profile's relations in one statement, plus one `category.findMany` for the catalogue in the same transaction; no raw SQL in U1 | typed, auditable, no geo in this entry | one hand-written statement (not needed: no geo, no paging) |
| T4 | Caching | the existing `privateCacheSeconds` + ETag/304 pipeline step; the memo excluded for worker entries | per-user bodies; the browser's private cache is the only shared layer | the response memo (per query, not per user) |
| T5 | Completion | a pure TypeScript function in `modules/worker/domain/completion.ts`; today's function ported to rows under `test/worker/oracles/` as the oracle; `fast-check` generators for profiles, requirement rows and catalogue rows (arbitraries shared with U2-U3) | testable in isolation; one definition | SQL CASE expressions |
| T6 | The services table | a TypeScript constant `SERVICE_REQUIREMENTS` in `modules/worker/domain/service-requirements.ts`, with the app's `getServiceDocumentRequirements` copied as its oracle | parity now; the catalogue question deferred to U3 | reading the catalogue (changes answers) |
| T7 | Backfill | `scripts/backfill-completion.ts` on the S1 backfill pattern (`--apply`, `--report`, dry run by default, production guarded) | the stored flags are wrong or missing for existing workers | none |
| T8 | Stages table | `infra/lib/stages.ts` values per U1-SCL-03; rendered YAML; drift test | the table is the source of truth | editing the YAML |
| T9 | Property testing | `fast-check` 4 (present) | PBT-09 | -- |
| T10 | New runtime dependencies | **none** | the read and the completion need nothing new | -- |

Versions pinned in the lockfile; `autocannon` added with an exact version and vetted (SECURITY-10).
