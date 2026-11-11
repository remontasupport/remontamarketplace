# U1 `history-api` -- construction notes

Branch `feat/document-history-api` (from `main` `a8ead2c`): `056c341` (db) + `2261ac9` (api, contract, docs).

## What changed
- `packages/db`: `document_versions` (+ `DocumentVersionReason`, audit action `DOCUMENT_VERSION_DELETE`), migration
  `20261111120000_document_versions` (expand-only; SQL equals `prisma migrate diff` from `main`'s schema) + `down.sql`.
- `apps/api` worker: `keepVersions` (`application/document-versions.ts`) at the five steps (re-upload service /
  compliance / contract via `isReplaced`; both worker deletes; `writeServices`); every post-commit `deleteDocumentFiles`
  removed from `worker.handlers.ts`. A fileless row (citizenship answer) keeps nothing.
- `apps/api` admin: `listDocumentVersions`, `getDocumentVersionLink`, `deleteDocumentVersion` (audited; file deleted
  only when no current row or other version uses it, and only if provably the worker's). Admin deps gain `blob`.
- Job `document-version-retention` (daily, 500/run), `DOCUMENT_VERSION_RETENTION` `report` (default) | `apply`.
- Contract: three admin entries, `openapi.json` regenerated. Docs: `docs/worker/README.md`, `docs/admin/README.md`.

## Gates (local, 2026-11-11)
api lint, tsc, 1,194 unit tests (database tests skipped: no local PostGIS; CI runs them); api-contract 138; db 50;
app quality 745; infra render:check; `turbo run build` both apps. Generated clients: only `auth-client` content kept.

## Still to do
- PR (user), CI green (API Quality runs the migration and the database tests), merge.
- Staging deploy, preview checklist: replace / delete / service removal each leave a version and the file; the three
  admin entries (list, link opens, delete removes row + file + audit row); retention summary `report` in
  `scheduled_jobs`; production unchanged. Then promote the full sha.
- `apply` for retention: a later config change (nothing is 7 years old before 2033).

## Outcome (2026-11-11)
Merged #162 (`main` `e73524c`); PR CI green with the database tests. Staging deploy 42928560306 (migration applied);
production promotion dispatch 42930455127 (migration applied); production health 200, the history route 401 (404
before). Previous production image `1e4d74e7d2e46cb8b1d3df8f107b7bcc7f6bfe01`. Retention runs in `report` mode.
