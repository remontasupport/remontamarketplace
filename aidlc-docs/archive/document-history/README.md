# Document history (cycle closed 2026-11-11)

**Goal (user, 2026-11-11):** "Currently the documents are being replaced and get deleted when being updated. I want to
have a historical feature in the admin account. I want the admin to be still retrieve past documents, how can we
implement this".

Decisions: deletes kept too; 7-year retention, admin can delete earlier on a new page; admins only; files only (no
review log); no new worker wording; versions cascade with the worker profile.

## What shipped (live)

| PR | Content |
|---|---|
| #162 `e73524c` (U1 `history-api`) | `document_versions` table + `DocumentVersionReason` + audit action `DOCUMENT_VERSION_DELETE` (migration `20261111120000_document_versions`, expand-only, `down.sql`); replace / worker delete / service removal keep a version row and the file (no post-commit file deletes left in the worker handlers); admin entries list / link / delete (audited, file deleted only when unused and provably the worker's); job `document-version-retention` (daily, 7 years, `DOCUMENT_VERSION_RETENTION=report`) |
| #163 `3cb3206` (U2 `history-app`) | `/admin/compliance/[id]/history`: grouped past documents, Open (five-minute link), Delete for good (modal); "Document history" link on the compliance page |

Production at the close: api image `e73524c0` (full sha from `main`, promotion dispatch 42930455127; previous
`1e4d74e7d2e46cb8b1d3df8f107b7bcc7f6bfe01`); app/web `main` `1f8d27f` (#164, a side fix after the cycle's #163).

## Not in the goal (same session)

#164 `68c028e`: the client dashboard no longer asks "Relationship with the client" (`askRelationship` switch on the
shared participant modals; support coordinators keep it).

## Deviations

None from the plan. A legacy Blob file already missing before the cycle showed "blob not found" in the History page
(see `construction/u2-history-app/construction-notes.md`); accepted by the user.

## Layout

`inception/` (requirements, execution plan), `construction/u1-history-api/`, `construction/u2-history-app/`,
`aidlc-state-at-close.md`. Audit: `aidlc-docs/audit.md` (2026-11-11 entries).
