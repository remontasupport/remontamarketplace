# U2 PR 3 -- the engine's section mode and the Edit Profile pages (`feat/edit-profile-app`)

Branch from `main` `67fef1d` (PR 2 live) with `chore/load-test-writes` folded in. Pushed `2965ec3`, 5 commits,
38 files (+2,574 / -390).

## What it contains

| Commit | Part | What |
|---|---|---|
| `a7692ad` | load test | 30 % write share (each worker's own preferred hours saved back, idempotent); `--reads-only` keeps U1's mix |
| `5fff3f1` | api | only the writes that can change a stored flag recompute completion (name, bio, personal info, ABN, photos, service area); hours, experience, work history, education, additional info and bank account no longer re-read the profile in their transaction (the load-test finding) |
| `b4dc809` | test | the completion property: equality on random inputs; coverage and partition sizes on the fixed-seed sample; `FC_RUNS`; 30 s limits |
| `3cc5fd1` | G1-G4, H2 | form-engine section mode (`defineSection` with import-time checks, seed/body, the write entry's own schema as validation, `saveSection` with retries and one token refresh); the 19 definitions and their round-trip tests |
| `2965ec3` | H1-H8 | the worker client, the shared profile query, `useSection`, `SectionPage` + `sectionFields.tsx`, the photo page, the shell, the index, the two routes, the redirects, `WORKER_MENU` + the sidebar, the admin page's private block, the mask copy, the privacy test, docs |

## Deviations from the plan (recorded)

1. **No `WorkerProfileProvider`.** The root layout already provides React Query; one query key `['worker','profile']`
   shares the read between the sidebar and the pages.
2. **The menu has 18 children, not 16.** R8.2's list plus Work history and Education after Experience: both were
   in the old profile-building menu, and dropping them would remove a feature. The ABN page exists
   (`/dashboard/worker/profile/abn`) but is not in the menu: the ABN is entered on the contract page today.
3. **Section kinds live in `section.ts`**, not `kinds.ts`/`types.ts`: the registration kinds' rule table does not fit
   a whole-section body validated by the contract. **Definitions are one file** (`features/worker/definitions.ts`,
   about 300 lines) rather than 18. **Field components** are a new `sectionFields.tsx` (`fields.tsx` was already
   467 lines); `SectionPage` holds the slot switch instead of `FormWizard`.
4. **Photos** use the worker client's four entries with the existing shrink/header/uploader adapters; the engine's
   `stagePhoto` is bound to a registration definition.
5. **After a save** the page seeds from the write's answer (`seedFromSaved`: a write answers with its body's shape,
   not the read's) and reloads the read with `cache: 'reload'`; the cached read is not patched by hand (it would
   corrupt it, the shapes differ). Engine additions: `setPath`, `seedFromSaved`, `emptyValuesOf`.
6. **The admin block sits above the profile card**, not in it: "Download JPEG Profile" captures `.profile-card`,
   which is sent to clients.
7. **The privacy test** also requires every client-facing worker read to `select` named columns (a read without
   `select` would return the street line without naming it), with a test proving the check fails.
8. **The job-apply banner** moved from the old profile layout into the shell, its readiness check now on the read.

## Changes after review (user, 2026-10-12; all on PR #57)

| Commit | Change |
|---|---|
| `c0f6c25` | sidebar labels: Edit Profile -> **My Profile** (Edit Services -> My Services, then superseded) |
| `f5fbcd0` | one **Services** group after My Profile: Edit Services, then each service's setup step |
| `5c20ff8` | CI fix: the completion property's R3.6 detector also sees a SERVICE_QUALIFICATION row named after a training (counterexample seed -647976850; test-only, the api was right) |
| `a09505a` | My Profile rearranged; the personal-info write split into three pages (Date of Birth, Gender, Vehicle), each carrying the other two answers (`carried` fields, shown while still empty); `/profile/personal-info` redirects to date-of-birth |
| `65c2130` | **Personal Information** sub-group |
| `3735cd8` | **Professional Information** sub-group; Vehicle renamed **Vehicle Access** (URL stays `/profile/vehicle`) |

My Profile now: **Personal Information** (Name, Profile Photo, Bio, Address, Date of Birth, Gender, Language) ·
**Professional Information** (Experience, Work History, Education, Preferred Hours, Vehicle Access) · **Other
Personal Info** (Good to Know, Cultural Background, Religion, Interests, About Me, Preferences, Personality) · Bank
Account. Sub-groups are declared once (`PROFILE_GROUPS` in `workerMenu.ts`); the sidebar and the index render any
of them. Preview check added: change Gender, then Date of Birth and Vehicle Access are unchanged.

Status at the end of 2026-10-12: CI 13/13 and both previews green at `3735cd8`; preview
https://remonta-9x0kufc2v-remontas-projects.vercel.app; **not merged, by the user's choice** (no production yet).

## Gates (local)

| Gate | Result |
|---|---|
| form-engine | 73 passed (P-7 boundary intact) |
| app | typecheck 139 known (was 142), lint 470 known (was 471): baselines tightened; tests 186 passed, 12 skipped |
| app build | compiled; `/dashboard/worker/profile` and `/profile/[section]` present |
| api (`5fff3f1`) | run when committed; CI re-runs with the database |

## Still to do before production

- CI on the PR; the preview checklist (H9) against staging: every section opens with its values, edits, saves,
  "Saved", the sidebar updates; a draft survives a reload; offline pauses and resumes; the photo flow; the address
  page's two forms and the reminder; the admin page block; the old URLs redirect.
- After merge (staging gets `5fff3f1`): the load test with writes re-run, reads p95 expected <= 300 ms.
- Promote the api image (full sha) only after that; the app goes live with the merge, so the api change must be
  in production first or at the same time: the pages work against PR 2's api (the completion change is internal).
- Production verification by an internal worker; CLAUDE.md's Vercel rollback rows re-recorded.
