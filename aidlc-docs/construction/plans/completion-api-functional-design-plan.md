# C1 `completion-api`: functional design plan (2026-10-21)

Unit: one declaration of "complete" in `apps/api`, `GET /v1/worker/completion`, the stored flags kept true, the
backfill. Requirements: `inception/requirements/completion-requirements.md` (FR-CMP, FR-STO, NFR-C1..C5). Plan:
`inception/plans/completion-execution-plan.md`.

## Read on `main` for this plan

- `domain/completion.ts`: the pure `completionOf(input)`; `CompletionInput` lacks the optional pages' columns
  (cultural background, religion, interests, support activities, preferences) and the home address; the read fetches
  them already (`profile-read.ts`).
- `domain/service-requirements.ts`: `uploadableDocuments(service, subcategories)` returns every document a service
  takes (name, kind, required); used only to check a confirm today, not exposed.
- `platform/jobs/scheduler.ts` + `onboarding-reconciler`: leased jobs with a watermark over changed rows, including
  `verification_requirements.reviewedAt` (the admin's review).

## Proposed design (no question needed; say so if you disagree)

1. **The declaration** `domain/completion-items.ts`: one array of items `{ id, group: 'my-profile' | 'services' |
   'compliance', required, page (the sidebar slug or the step), done(input) }`. The 18 My Profile pages by their
   sidebar slugs (FR-CMP-02, CD3); the Services parts: `services-chosen`, one `service-documents:<category>` per chosen
   service (today's `services` rule per service), `service-area`; the Compliance parts: one item per required
   document (today's `compliance` rule, per document) and per required training. Every measure is derived from it.
2. **`GET /v1/worker/completion`** answers `{ percent, profileCompleted, groups: [{ id, complete, firstUnfinished:
   { page, label } | null }], items: [{ id, group, required, done }], serviceDocuments: [{ categoryId, documents:
   [{ type, name, kind, required, uploaded }] }] }` (the last part closes OC-2, from `uploadableDocuments`). Worker
   read limits; **private cache 60 s with ETag, reloaded by the app after a save**, as the profile read (one request
   per page, shared by the sidebar and the page through the app's query cache).
3. **The stored flags' two meanings** (NFR-C1): `COMPLETION_MODEL = legacy | groups`, a per-stage setting in
   `infra/lib/stages.ts` (default `legacy`). `legacy`: the four flags exactly as today. `groups`: `accountDetails` =
   My Profile complete, `services` = Services complete, `compliance` and `trainings` as today, `profileCompleted` = all
   three groups. The writes, the job and the backfill read the setting; the new entry always answers the new model.
4. **The completion job** `completion-sync` (OC-1): the reconciler's shape -- the rows changed since the watermark
   (profiles, documents incl. `reviewedAt`, services, locations, additional info), recomputed in batches of 200, written
   only when they differ (`persistCompletion`, unchanged); plus a full pass once a day for catalogue changes.
5. **The backfill** `pnpm --filter @remonta/api backfill:completion` (dry run, `--report`, `--apply`), as the S1
   backfills: every worker under the stage's model.
6. **The old function as the oracle**: today's `completionOf` stays for the property test (where the old and new
   rules agree they must match; the tables list every case they differ on purpose).

## Plan

- [ ] 1. The items, their rules and groups (domain-entities.md, business-rules.md) -- Q1
- [ ] 2. The entry's shape, errors, caching
- [ ] 3. The two meanings of the stored flags and the setting
- [ ] 4. The job: what counts as a change, batches, the daily full pass -- Q2
- [ ] 5. The backfill and its report
- [ ] 6. The service documents in the entry (OC-2) -- Q3
- [ ] 7. The oracle comparison and the property candidates (for NFR Design)
- [ ] 8. Artifacts: `construction/completion-api/functional-design/{domain-entities,business-rules,business-logic-model}.md`

## Questions

## Question 1
When does the **Bio** page count as filled?

A) 50 characters or more (as the tick and the percent use today; the page accepts 1-2,000) (recommended)

B) Any text

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
After an admin approves, rejects or resets a document, how soon must the worker's stored completion (what the admin
screens show) follow?

A) Within 5 minutes, by the job running every 5 minutes on what changed (like the onboarding reconciler), plus a full
pass once a day (recommended)

B) Once a day is enough

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
A service's documents on the Services checklist item: a service with only **optional** documents (e.g. Support
Worker: a certificate is optional). When is that service "done"?

A) As today's rule: done when at least one of its optional documents is uploaded (recommended: no change to who is
complete)

B) Done with nothing uploaded (optional means optional)

X) Other (please describe after [Answer]: tag below)

[Answer]: 
