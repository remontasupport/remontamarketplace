# Migrations — read this before running anything

## `0_init` is a baseline. Never run it.

`0_init/migration.sql` describes the database **as it already exists**. It was generated
from `auth-schema.prisma` with `migrate diff --from-empty`, and it is registered with
`migrate resolve --applied` — which writes only to Prisma's bookkeeping table and
executes none of the SQL.

Running it against a live database would attempt to create 20 tables that are already
there. It exists so that Prisma has a starting point, and so every migration from here
on is a real, reviewable, reversible change.

## `prisma db push` is banned on this project

`db push` makes the database match the schema file by **dropping whatever does not
match**. It keeps no history and offers no way back. It is how you lose 1,680 worker
profiles. The npm script has been removed; do not reintroduce it.

Use `npm run db:migrate` in development and `npm run db:migrate:deploy` in production.

## Every migration ships with its reverse

Prisma only moves forward — there is no `migrate down`. So each migration directory
carries a `down.sql` written at the same time as the forward change, generated with
`migrate diff` run in the opposite direction and **tested on a Neon branch**, not
merely written.

A migration without a tested `down.sql` is not ready to merge.

## Indexes on large tables must be created concurrently

A plain `CREATE INDEX` takes an ACCESS EXCLUSIVE lock and blocks writes for the
duration. `db push` never used `CONCURRENTLY`, which is one reason index changes were
risky here. On `verification_requirements` (9,254 rows) and `worker_profiles` (1,680),
use `CREATE INDEX CONCURRENTLY` — and note it cannot run inside a transaction, so it
belongs in its own migration.

## Where the old hand-written SQL went

`prisma/legacy-sql/` — six scripts from a manual `worker_services` migration predating
this history. Kept for reference. **None of them should be run.** One is named
`quick_restore_and_migrate.sql`; treat it as a historical artifact, not a tool.
