# Requirements -- Worker sign-up draft: nothing kept on the device between visits

**Depth:** Minimal. One browser-side behaviour of one form changes; no server, schema, contract or infrastructure
change. The three extensions are enabled (Security and Resiliency blocking, PBT partial) and are assessed below;
almost every rule is N/A or already satisfied by the live Slice 1 system.
**Sources:** the user's request in chat (2026-10-02, logged in `audit.md`), `cycle-kickoff-questions.md` (Q1 = E,
Q2 = C proposed), `requirement-verification-questions.md` (V1-V6), and the code read during analysis.

---

## 1. Intent analysis

| | |
|---|---|
| **User request** | "I want to fix something on the registration/worker. I noticed that the answers to the form is being save to the localhost. If I close the browser and go to the registration/worker, the answers are still there. Can you design a system that deletes it instead? I don't want to save an answer to a localhost" |
| **Request type** | Enhancement of a live feature (privacy behaviour of the sign-up wizard) |
| **Scope estimate** | Single component: the form engine's on-device draft and its browser adapter in `apps/app` |
| **Complexity estimate** | Simple: the engine already takes the storage as a parameter; the change is which storage the browser supplies, plus a one-time clean-up, tests and documentation |

## 2. What the code does today

- `packages/form-engine/src/draft.ts`: 500 ms after any change the wizard writes `{ v, savedAt, mode, step, values }`
  as one JSON entry under `remonta.form.<formId>.draft.v1` through a `KeyValueStore` the platform supplies. On load
  the entry is restored if it is the same backend mode and younger than 23 h; otherwise it is deleted. The entry is
  deleted when the sign-up succeeds. Fields marked `neverSaved` (the password and the email verification) are stripped
  before saving and again on load.
- `apps/app/src/features/forms/adapters/browser.ts`: `browserStore()` returns `window.localStorage`, or `null` when
  the browser blocks storage. `localStorage` persists on disk across browser sessions, which is what the user observed.
- `apps/app/src/features/forms/useFormWizard.ts`: creates the store once, restores the draft on mount, saves on change,
  clears on success.
- `apps/app/src/features/forms/photoPreview.ts`: the photo thumbnail (a few KB data URL) and the staged photo id are
  part of the saved values by design.
- The legacy sign-up page (`features/forms/legacy/worker/`) saves nothing. Only the api-mode form is affected.
- `docs/signup/01-flow.md` ("What the page keeps between visits") documents the `localStorage` behaviour.

## 3. Decisions (from the verification questions)

| # | Decision | Source |
|---|---|---|
| D1 | The browser supplies **`sessionStorage`** instead of `localStorage`. Progress survives a page refresh and the offline pause within the same tab; the browser deletes it when the tab or browser is closed. Nothing is kept between visits | V1 A |
| D2 | **One-time clean-up**: on the next visit the browser adapter deletes any entry left under the old `localStorage` key, so no answer remains on a device for up to 23 h after the change goes live | V2 A |
| D3 | The branch `aidlc/archive-s1` is **merged first** via its own PR (CI, preview check); this fix is built on a fresh branch from `main` | V3 A |
| D4 | Security baseline: **Yes, blocking** | V4 A |
| D5 | Resiliency baseline: **Yes, blocking**; targets and processes carry forward from Slice 1 (section 6) | V5 A |
| D6 | Property-based testing: **Partial** (PBT-02, 03, 07, 08, 09 enforced; the rest advisory) | V6 B |
| D7 | Reverse Engineering: **skipped**; the files involved were read during analysis (section 2) | kick-off Q2 C |

## 4. Functional requirements

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | Closing the browser (or the tab) and returning to `/registration/worker` shows an empty form at step 1. No answer typed in a previous browser session is shown or present in browser storage | Must | request, D1 |
| FR-02 | Within one tab, a page refresh (and the engine's offline pause) still restores the step and the answers, as today, minus the `neverSaved` fields | Must | D1 |
| FR-03 | A draft written by the current code under the `localStorage` key is deleted the next time the form page loads in that browser, whether or not a new draft is then started | Must | D2 |
| FR-04 | The engine's behaviour is unchanged: `neverSaved` stripping, the 23 h expiry, mode mismatch handling, clearing on success. Only the store the browser supplies changes | Must | D1 |
| FR-05 | When storage is unavailable (private mode, blocked), the form works without a draft, as today | Must | existing |
| FR-06 | The legacy sign-up page is untouched | Must | section 2 |
| FR-07 | `docs/signup/01-flow.md` and the engine's module comment describe the new behaviour (same PR) | Must | CLAUDE.md "Reference docs" |

## 5. Non-functional requirements

| ID | Requirement | Source |
|---|---|---|
| NFR-01 | **Privacy**: no sign-up answer persists on the device beyond the browser session. The password and email verification stay `neverSaved` even within the session | request |
| NFR-02 | **No new dependency, no contract or api change**, no schema change. `packages/form-engine` keeps its P-7 boundary (no DOM): the storage choice stays in the `apps/app` adapter | CLAUDE.md |
| NFR-03 | **Rollback**: a one-line revert of the adapter restores `localStorage`; no data migration is involved. Vercel promote-previous-deployment also applies | CLAUDE.md "Rollback" |
| NFR-04 | **Tests**: the existing draft tests keep passing; a test proves the adapter returns the session store and that the old key is removed; a property-based round-trip test covers save/load of the draft (PBT-02) | D6 |
| NFR-05 | **Quality gates**: `@remonta/form-engine` and `@remonta/app` quality scripts and `turbo run build` pass; the PR goes through the CLAUDE.md process (branch, CI, preview check with a real refresh/close test, merge, production check) | CLAUDE.md |

## 6. Extension compliance (Requirements stage)

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 encryption at rest/in transit | N/A | No server-side store changes. Browser `sessionStorage` is per-origin, in-memory for the tab's life; the page is served over HTTPS |
| SECURITY-02, 06, 07 (intermediaries, IAM, network) | N/A | No infrastructure change |
| SECURITY-03 logging | N/A | No logging change; the draft is never logged |
| SECURITY-04 headers, 05 input validation, 08 access control, 12 auth | Unchanged | No endpoint or auth change; the draft never reaches a request (the engine builds the body from declared fields) |
| SECURITY-09 hardening | Compliant | The change reduces data at rest on the client; `neverSaved` still excludes secrets |
| SECURITY-10 supply chain | Compliant | No new dependency; the lock file is unchanged |
| SECURITY-11 secure design | Compliant | Data minimisation: the draft lives only as long as the tab |
| SECURITY-13 deserialization | Compliant (existing) | `loadDraft` validates shape, mode and age before use and deletes anything malformed |

### Resiliency (blocking) -- carried forward from Slice 1

The workload, its SLA (99.9 %), RTO (≤ 30 min) and RPO (≤ 5 min), the change-management process (CLAUDE.md),
the deployment tooling (GitHub Actions, Vercel), the rollback mechanism and the regional topology were decided in the
Slice 1 requirements (NFR-RES-01..04, OI-06) and are live. This cycle changes none of them; per the baseline's own
instruction to conform to an existing process rather than redefine it, they are referenced, not re-asked.

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01..04 | Compliant (inherited) | As above |
| RESILIENCY-05..07 monitoring, health, resiliency monitoring | N/A | No deployed component changes |
| RESILIENCY-08..09 topology, scaling | N/A | Browser-side change only |
| Data durability of the draft | Accepted trade-off | A draft now lives at most for the tab's life. This is the requested behaviour; the server-side staged photo and email ticket keep their own expiry (24 h / their TTL) and are simply unused if the worker returns later |

### Property-based testing (partial)

| Rule | Status | Note |
|---|---|---|
| PBT-02 round-trip | To do (Code Generation) | `saveDraft` → `loadDraft` round-trip over generated drafts (values without `neverSaved` keys, any step, same mode, age < 23 h) in `packages/form-engine/test` |
| PBT-03 invariants | To do (Code Generation) | `neverSaved` keys are never present after `loadDraft`, for any generated values and key set |
| PBT-07 generators | To do | Generators produce realistic form values (strings, numbers, booleans, string arrays, nested id objects), not arbitrary JSON |
| PBT-08 shrinking/seed | Compliant (existing) | `fast-check` 4.9 is already used in both packages; failures print the seed |
| PBT-09 framework | Compliant (existing) | `fast-check` |
| PBT-01, 04, 05, 06, 10 | Advisory | Example-based tests remain alongside (PBT-10 satisfied in practice) |

## 7. Out of scope

- Any change to what the server keeps (staged photos, email tickets, rate-limit buckets).
- The legacy sign-up page and the `legacy` switch branches (follow-up 3 in the state file).
- Other forms: no other form uses the engine yet; when they do, they inherit this behaviour through the adapter.

## 8. Acceptance (preview checklist for this change)

1. Fill two steps on the preview, refresh: step and answers are back.
2. Close the tab, open `/registration/worker` again: step 1, empty, and the browser's storage inspector shows no
   `remonta.form.*` entry in either `localStorage` or `sessionStorage`.
3. Seed a fake entry under the old `localStorage` key, load the page: the entry is gone.
4. Complete a sign-up with an internal email on the preview (staging api): success page, and no draft left.
5. Production, after merge: step 2 repeated on the live domain in legacy and api mode (api mode is live).
