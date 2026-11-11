# U2 `history-app` -- construction notes

Branch `feat/document-history-app` (from `main` `e73524c`): `29d084f`. The api it calls (U1) is in production since
2026-11-11 (dispatch 42930455127), so the merge order is safe (follow-up 32).

- `apps/app/src/app/admin/compliance/[id]/history/page.tsx`: the page (R3, R4). Groups by requirement type, newest
  first; Open = a tab opened before the await, then the five-minute link; Delete = a modal ("Delete for good"), then
  the api; a 404 on delete drops the row (already gone). Empty state says history starts now (R7).
- `features/admin-document-history/history.ts` (+ test, PBT on grouping): grouping, reason labels, dates, removal.
- `lib/api/admin.ts`: `listDocumentVersions`, `getDocumentVersionLink` (cache `reload`), `deleteDocumentVersion` (+ tests).
- Compliance page header: a "Document history" link.
- Gates: app quality (54 type / 273 lint known, 753 tests), lint clean on the new files, app build lists the route.
- Preview checklist: sign in as admin, open a worker with a replaced/deleted document, the history lists it, Open shows
  the file, Delete removes it (and the audit row), the compliance page link works; production unchanged.

## Outcome (2026-11-11)
Merged #163 (`main` `3cb3206`); CI green, Vercel production built, `/admin/compliance/x/history` answers 200. The
user tested it in production. One report: a legacy Vercel Blob file (uploaded 2026-09-24) answered "blob not found"
from the History page. Traced: the worker's delete went through the new code (a version row exists, no file delete
in that path); the file was already gone (most likely a URL shared with another row, deleted under the old
behaviour). Not a regression; the user accepted it ("the blob not found is ok already").
