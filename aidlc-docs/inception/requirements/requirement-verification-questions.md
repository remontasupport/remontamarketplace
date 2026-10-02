# Requirement Verification Questions -- worker sign-up draft

**Your request (2026-10-02):** the answers typed into `/registration/worker` are kept in the browser's
`localStorage`; closing the browser and coming back shows them again. You want them deleted instead and do not
want answers saved there.

**What the code does today** (read, not assumed):

- `packages/form-engine/src/draft.ts` saves the form's values and step as one JSON entry
  (`remonta.form.<formId>.draft.v1`), 500 ms after every change, through a storage the platform supplies.
- `apps/app/src/features/forms/adapters/browser.ts` supplies `window.localStorage`, so the entry survives closing
  the browser. It expires after 23 h and is deleted when the sign-up succeeds.
- Never saved: the password and the email verification (`neverSaved` fields). The photo thumbnail and the staged
  photo id are saved.
- The draft exists for two reasons: a page refresh or a dropped tab loses nothing, and the offline pause can resume.
- The legacy sign-up page (`features/forms/legacy/worker/`) saves nothing; only the api-mode form is affected.

Please answer each question by writing the letter after the `[Answer]:` tag. Say "done" when finished.

## Question 1
What should hold the form's progress instead of `localStorage`?

A) **The tab's session storage (`sessionStorage`).** Progress survives a page refresh and the offline pause inside
the same tab, and is deleted by the browser when the tab or the browser is closed. Nothing is kept between visits.
One-line change in the browser adapter, no change to the engine. Recommended.

B) **Memory only, nothing written to the browser.** The engine gets no storage; a refresh or a dropped tab starts the
form over from step 1 (the email must be verified again and the photo uploaded again). The offline pause still works
because the page stays open.

C) **Keep `localStorage` but delete the entry when the page is left** (`pagehide`). The data still touches the disk
and mobile browsers do not fire the event reliably, so a draft can survive. Not recommended.

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Drafts already saved by the current code sit in visitors' browsers under the `localStorage` key until they expire
(23 h after the last change). Should the new code remove them?

A) **Yes, delete the old `localStorage` entry on the next visit** (one-time clean-up in the browser adapter), so no
answer stays on a device for up to a day after the change goes live. Recommended.

B) **No, let them expire.** Simpler; the old entries disappear by themselves within 23 h of their last save.

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
The branch `aidlc/archive-s1` holds 13 commits that are not on `main`: the S1 close-out audit entries, the archive
move (with the CLAUDE.md, `infra/README.md`, workflow and setup-script repointing), one verified code change (the
photo-preview thumbnail, `55d52db`), and this cycle's documents. Nothing of it is on `main` or in production. What
should happen to it?

A) **Open a PR now and merge it** (after CI and a preview check), then start this fix on a fresh branch from `main`.
Recommended: every merge to `main` is a production deploy, and this one carries one small, verified code change.

B) **Open the PR now but keep working on top of the branch**; the fix stacks on it and goes out in the same PR.

C) **Leave it for now**; keep stacking on this branch and merge everything later in one PR.

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4: Security Extensions
Should security extension rules be enforced for this project? (Slice 1 used: Yes, blocking.)

A) Yes -- enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No -- skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5: Resiliency Extensions
Should the resiliency baseline be applied to this project? (Slice 1 used: Yes, blocking. This cycle changes only the
browser-side draft; the baseline would mostly restate the refresh/offline behaviour chosen in Question 1.)

A) Yes -- apply the resiliency baseline as directional best practices and design-time guidance

B) No -- skip the resiliency baseline for this cycle

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project? (Slice 1 used: Yes, full enforcement. The
draft module already has a save/load round-trip test that can be made property-based.)

A) Yes -- enforce all PBT rules as blocking constraints

B) Partial -- enforce PBT rules only for pure functions and serialization round-trips (fits this change)

C) No -- skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]: B
