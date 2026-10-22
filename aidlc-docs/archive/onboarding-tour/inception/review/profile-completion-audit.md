# Profile completion: audit (2026-10-21)

Request (user, verbatim in `audit.md`): "audit the profile completion of the workers, how it was track from the api and
backend, analyse the structure of this feature and apply improvements". Read on `feat/account-app` `ffad332` (the
release candidate) and `main` `f00a3cb` (production api). No code changed by this audit.

## 1. How it works today

```
                       ┌─────────────── apps/api (the source) ────────────────┐
 a worker save ──────► │ replaceSection → work → completionOf(rows) ──► persistCompletion │──► worker_profiles
 (21 of 27 writes)     │                         (pure, domain/completion.ts)  (only if changed) │    .setupProgress (4 flags)
                       │                                                                         │    .profileCompleted
 GET /v1/worker/profile│ readProfileRows → completionOf(rows) → profile.completion               │    .verificationStatus
                       └──────── computed fresh on every read ─────────────────────────────────┘    NOT_STARTED→IN_PROGRESS
                                         │
         ┌───────────────────────────────┼──────────────────────────────────────┐
         ▼                               ▼                                      ▼
 Sidebar "My Profile" badge     Home checklist (ProfileCompletionReminder)   Sidebar ticks per link
 completion.percent (< 80)      the 4 flags → "n of 4", its own bar,          workerMenu.ts EDIT_PROFILE_CHILDREN.done
 ProfileIndex "x% complete"     "resume" link, congratulations at 4/4         -- 18 rules written again in the app
```

**The api's measures** (`apps/api/src/modules/worker/domain/completion.ts`, documented in `docs/worker/README.md` §4):

| Measure | Rule | Persisted |
|---|---|---|
| `accountDetails` | first + last name, photo, bio (any length), **city, state, postcode** (the legacy columns the service area dual-writes), gender, age or date of birth | yes, `setupProgress` |
| `compliance` | services chosen; every required IDENTITY/BUSINESS/COMPLIANCE catalogue document present (aliases, 100 points, ABN or contract, code of conduct) and every such row SUBMITTED or APPROVED | yes |
| `trainings` | services chosen; every required TRAINING document SUBMITTED or APPROVED | yes |
| `services` | per service, the table in `domain/service-requirements.ts` against SERVICE_QUALIFICATION rows | yes |
| `profileCompleted` | all four | yes |
| `percent` | 13 sections: name, photo, bio ≥ 50, **a HOME location (the service area)**, personal info (dob/age, gender, vehicle, **a language**), a valid ABN, a service, availability, experience, a job, education, **additional-info languages**, personality | no (read only) |

## 2. Findings

| # | Finding | Effect on a worker or an admin | Where |
|---|---|---|---|
| F1 | **Three different "how complete am I" measures on one screen**: the badge's percent (13 sections), the checklist's "n of 4" with its own bar, and the per-link ticks (18 app rules). They count different things. | A worker can see every My Profile link ticked while the badge says 69 %; or the badge at 100 % while the checklist says 1 of 4. Nothing tells them which to trust. | `Sidebar.tsx`, `ProfileCompletionReminder.tsx`, `workerMenu.ts` |
| F2 | **The ticks are a second copy of the rules, in the app**, and they disagree with the api: the Address tick = the private home address, the percent's "address" = the service area; the percent counts the ABN and a chosen service (not My Profile pages) and leaves out Cultural Background, Religion, Interests, Support & Activities, Preferences (which have ticks). | Drift is guaranteed as rules change; CLAUDE.md's "declare once" is broken for completion. | `workerMenu.ts` 18 `done` functions vs `filledSections` |
| F3 | **"Account Details" depends on the Service Area**: it needs city/state/postcode, which only the service-area save writes (the dual write). The checklist's Account Details link goes to My Profile, where none of those fields is. | A worker who fills every My Profile page still has Account Details unticked until they set a Service Area in Services. | `accountDetailsOf`, `putServiceArea` dual write |
| F4 | **Languages counted twice** in the percent (inside "personal info" and as its own section); the two read different columns (`worker_profiles.languages` vs `worker_additional_info.languages`). | One answer moves the percent by up to two sections; or one of the two never fills. | `filledSections` |
| F5 | **The stored flags go stale outside the api**: an admin's approve / reject / reset of a document (`app/api/admin/compliance/[id]/[documentId]/*`) changes the status that `compliance`/`trainings` depend on, without recomputing `setupProgress`/`profileCompleted`. A catalogue change (a newly required document) does not either. | The worker's own screens are right (computed on read); the admin's contractor profile and the share page read the **stored** flags (`profilePreview.service.ts`) and can show "complete" for a rejected document, or the reverse. | admin routes; `profilePreview.service.ts` |
| F6 | **A fifth rule set gates applying for a job** on the profile page: `applyReadiness` (Experience, Fun Fact, Languages, Interests, Support & Activities), while `NewsSlider` says "Apply is no longer gated on profile completion (product decision, 2026-09-23)". | Contradictory: the job slider lets the worker apply; the profile page's Apply button is disabled with "To apply, complete: …". | `workerMenu.ts` `applyReadiness`, `ProfileShell.tsx` |
| F7 | **The checklist is from before the new sidebar**: "My Services" (the menu says Services), "Trainings" as its own item (the menu folds it into Compliance), and its resume link goes to the first unfinished flag's old setup URL. | Wording that no longer matches the menu the tour just taught. | `ProfileCompletionReminder.tsx` |
| F8 | **The service document table exists twice**: `apps/app/src/config/serviceDocumentRequirements.ts` (what the upload step asks for) and the api's `domain/service-requirements.ts` (what `services` checks); the app hyphenates sub-category *names*, the api uses catalogue ids. They agree today (the catalogue ids are hyphenated names) by convention, not by construction. | A rename on one side makes the step ask for documents the flag does not need, or the reverse. | the two tables |
| F9 | **The profile read cannot grow**: `profileSchema` is strict and the deployed app's client rejects an unknown field, so moving the ticks' rules into the api (F2) means a new entry or a release that relaxes the client first (as the tour did). | A structural constraint for every future profile change. | `client.ts`, `profileSchema` |

What is sound: the api's computation is pure, one input, tested against today's function as an oracle with property
tests; it is recomputed inside each write's transaction; the read never trusts the stored flags.

## 3. Improvements proposed (for the user's choice: `requirements/completion-questions.md`)

| # | Improvement | Fixes |
|---|---|---|
| I1 | **One declaration of "complete", in the api**: per section done states (every My Profile link, Services, Compliance), the four checklist items and the percent, all derived from it; returned by a new `GET /v1/worker/completion` (additive: today's app is unaffected); the app's ticks, badge and checklist read it and its 18 `done` rules go | F1, F2, F4, F9 |
| I2 | **Decide what the percent counts** (the My Profile sections only, so the badge on My Profile matches its ticks), and what the checklist's four items are, named as the new menu names them | F1, F7 |
| I3 | **Account Details from the profile itself**: the home address (or the service area, by decision) instead of the legacy city/state/postcode | F3 |
| I4 | **Keep the stored flags true**: recompute after the admin's approve / reject / reset (a small api entry the admin routes call, or the routes moved to the api), and a nightly job that recomputes every worker (catalogue changes, legacy writes); or stop reading stored flags anywhere and drop them later | F5 |
| I5 | **One apply rule**: remove the profile page's gate (the 2026-09-23 decision) or restore it everywhere | F6 |
| I6 | **One service document table**: the api's, exposed in the requirement groups the profile read already returns; the app's copy retired | F8 |
