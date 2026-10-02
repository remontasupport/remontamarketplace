# Cycle Kick-off Questions

The new AI-DLC cycle was started on 2026-10-02 with "start ai dlc" and no stated intent. Requirements Analysis
needs one. Please answer each question by writing the letter after the `[Answer]:` tag; choose the last option
(Other) and describe if nothing fits. Say "done" when finished.

Context: Slice 1 (worker registration on `apps/api`) has been live in production since 2026-10-02 10:20Z. The open
follow-ups it left are listed in `aidlc-docs/aidlc-state.md` under "Follow-ups left open by Slice 1".

## Question 1
What is this cycle about?

A) **Slice 2 -- worker search on PostGIS.** Move the worker-search readers (client search, public list, admin list,
`lib/worker-search.ts`) from `worker_profiles.latitude/longitude` to `worker_locations` + PostGIS, through
`apps/api`; then stop the api's legacy dual write; then a migration drops the old columns. The first item the standing
instruction parked.

B) **Slice 2 -- another business domain onto `apps/api`** (for example worker onboarding after sign-up, client
sign-up, or the job flow). Describe which after the tag.

C) **Slice 1 close-out and hardening, no new domain.** The cut-over clean-up (delete the legacy sign-up page and the
`legacy` switch branches once the canary is accepted), the CRM notification outbox handler (n8n -> Zoho), the
reCAPTCHA wording in the form engine, and the smaller items in the follow-ups list.

D) **Security and housekeeping first.** Rotate the exposed credentials (production auth db role, Blob token, Prisma
Accelerate key, `rehearse-w1` password), decide the repository's visibility, delete stale branches and the production
test account. Then start a slice in a later cycle.

E) **A feature that is not in the follow-ups list.** Describe it after the tag.

F) Other (please describe after [Answer]: tag below)

[Answer]: E -- answered in chat (2026-10-02): "I want to fix something on the registration/worker. I noticed that the
answers to the form is being save to the localhost. If I close the browser and go to the registration/worker, the
answers are still there. Can you design a system that deletes it instead? I don't want to save an answer to a
localhost". Recorded by the AI; the detail questions are in `requirement-verification-questions.md`.

## Question 2
Reverse Engineering. The archived analysis (2026-09-25) covered the registration, onboarding, identity and platform
code of `apps/app` and predates `apps/api`, `packages/api-contract`, `packages/form-engine` and `infra/`. How should
this cycle refresh its picture of the code?

A) **Targeted refresh of the domains in scope for Q1** (the previous cycle's approach): new artifacts in
`aidlc-docs/inception/reverse-engineering/` for the code the cycle will touch, plus a short delta of what Slice 1
added. The archive stays the reference for everything else.

B) **Full re-run across the monorepo**: all nine artifacts regenerated for `apps/app`, `apps/web`, `apps/api`,
`packages/*` and `infra/`. Thorough, slower, and most of it would describe code the cycle will not touch.

C) **Skip**: rely on the archive, `docs/signup/README.md` and CLAUDE.md. Reasonable only if Q1 is C or D.

D) Other (please describe after [Answer]: tag below)

[Answer]: C -- proposed by the AI (2026-10-02) given Q1: the change touches the form engine's draft module, the
browser adapter, their tests and one doc paragraph, all read during Requirements Analysis; a reverse-engineering pass
would add nothing. Say so if you want A instead. Final decision recorded at Workflow Planning.

## Question 3
The branch `aidlc/archive-s1` holds 12 commits that are not on `main`: the S1 close-out audit entries, the archive
move (with the CLAUDE.md, `infra/README.md`, workflow and setup-script repointing), and one code change (the
photo-preview thumbnail, `55d52db`, which went through the preview checklist). None of it is on `main` or in
production. What should happen to it before the cycle's own work starts?

A) **Open a PR now and merge it** (after CI and a preview check), so the new cycle starts from `main`. Recommended:
every merge to `main` is a production deploy, and this one carries one small, verified code change.

B) **Open the PR now but keep working on top of the branch**; merge when convenient. The cycle's early documents
stack on the same branch.

C) **Leave it for now**; keep stacking the cycle's documents on this branch. The code change and the archive reach
`main` later in one larger PR.

D) Other (please describe after [Answer]: tag below)

[Answer]: moved -- this question is now Question 3 of `requirement-verification-questions.md`, so there is one file
to answer.
