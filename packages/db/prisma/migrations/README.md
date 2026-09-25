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

## Generated `point` columns: edit every future `migrate dev` output

`au_localities.point` and `worker_locations.point` are `GENERATED ALWAYS AS (...) STORED`
geography columns (S1). Prisma cannot express a generated column and reads the
expression as a default, so every `migrate dev` / `migrate diff` against a migrated
database proposes:

    ALTER TABLE "au_localities" ALTER COLUMN "point" DROP DEFAULT;
    ALTER TABLE "worker_locations" ALTER COLUMN "point" DROP DEFAULT;

**Delete those lines from any generated migration.** They are the only expected drift;
anything else in a diff against a migrated database is real. The same applies to the
partial unique index `worker_locations_one_home_per_worker` and the CHECK constraints in
the S1 migrations -- Prisma does not know about them and will not recreate them.

## Indexes Prisma cannot express

`users_lower_email_idx` on `users (lower(email))` (S1 step 9b) exists only in its
migration: the schema cannot declare an expression index. Prisma ignores it --
`migrate diff` does not propose dropping it (verified) -- so do not "fix" the schema
by adding a plain `@@index([email])`, and do not remove the migration. Sign-in depends
on it (`apps/app/src/lib/user-lookup.ts`).

## Testing a `down.sql` locally

Use a database created from `template0`, not the `postgis/postgis` image's default
database: that one ships with `postgis_topology` and `postgis_tiger_geocoder`
pre-installed, which makes `CREATE EXTENSION` a no-op and blocks `DROP EXTENSION`.

    docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgis/postgis:16-3.4
    docker exec pg psql -U postgres -c "create database clean template template0"
    # AUTH_DATABASE_URL = DIRECT_DATABASE_URL = postgresql://postgres:postgres@localhost:55432/clean
    npx prisma migrate deploy --schema=prisma/schema.prisma
    # run each down.sql newest first, then compare with the previous schema:
    npx prisma migrate diff --from-url "$AUTH_DATABASE_URL" --to-schema-datamodel <previous schema.prisma> --script

An empty diff means the reversal is exact. After a reversal, delete the reversed rows
from `_prisma_migrations` before re-applying.
