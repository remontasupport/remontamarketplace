# Code generation plan: U6 `drop-columns-schema` (2026-10-29)

Requirements: FR-13 (first release), FR-11r. Branch `feat/drop-columns-schema` from `main` after U5 is live
(`remonta-api-00027-rp9`). Schema only: **no migration, no database change**; the columns and their data stay.

Why a release of its own: after it, no running image's Prisma client knows the six fields, so U7's DROP cannot break a
running query (a client that knows a column selects it on any read without `select` and on every `create`'s RETURNING).

## Changes

1. `packages/db/prisma/schema.prisma`, `WorkerProfile`: remove `location, city, state, postalCode, latitude, longitude`
   and the five indexes on them (`city`, `latitude+longitude`, `postalCode`, `state`, `isPublished+city`). The indexes
   stay in the database until U7 (Prisma does not compare; deploy runs `migrate deploy` only, no drift check).
   Comment on `homeStreetLine` updated (it names "the legacy location columns above").
2. The committed app auth client (`apps/app/src/generated/auth-client`) refreshed: only files with real content changes.
3. Tests that still name the columns (they would not compile): `registration.int` (asserts null), `sections.int`
   (`LEGACY` select), any harness; the api guard keeps its SQL check (raw SQL is not type-checked) and the app guard stays.
4. Docs: `docs/signup/03-data-model.md` (columns "kept until U7, not in the schema").
5. Gates (all), build; CI.

## Release

- Merge: the app (Vercel) builds with the new client at once; staging api deploys; preview checklist (short: sign-in,
  dashboard, a sign-up, a service-area save, admin search, worker profile, public search).
- Promotion of the api image (user). Rollback: the previous app deployment / api image (`ba12ece`); both work because
  the columns still exist.

## U7 (later, separate)

A migration `DROP INDEX` x5 + `ALTER TABLE worker_profiles DROP COLUMN` x6, preceded by a Neon branch of production
(the only way back). Only after U6 runs in production for app and api; rollback after U7 = U6's images or later only.
