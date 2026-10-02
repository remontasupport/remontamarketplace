# Code Generation Plan -- unit `draft-storage` (worker sign-up draft: nothing kept between visits)

**Single source of truth for Code Generation of this cycle.** Branch `fix/signup-draft-session-storage` from
`main` at `ea3e669` (PR #28 merged). Workspace root: the repository root; nothing under `aidlc-docs/` is code.

## Unit context

- **Requirements implemented**: FR-01..07, NFR-01..05 (`aidlc-docs/inception/requirements/requirements.md`).
- **Decisions**: D1 `sessionStorage`; D2 one-time deletion of the old `localStorage` entry; D6 PBT partial
  (PBT-02, 03, 07, 08, 09 enforced).
- **Dependencies**: `@remonta/form-engine` (`KeyValueStore`, `draftKey`, `saveDraft`, `loadDraft`); `fast-check` 4.9
  (already a dev dependency of both packages). No new dependency.
- **Interfaces**: `browserStore(formId, host?)` in `apps/app/src/features/forms/adapters/browser.ts` returns the
  `KeyValueStore | null` the wizard hook passes to the engine. The engine's API does not change.
- **Boundaries**: the storage choice stays in `apps/app` (adapter); `packages/form-engine` stays DOM-free (P-7).
- **Not touched**: `features/forms/legacy/worker/`, any contract, schema, handler, or infra file.

## Design of the change

```ts
// apps/app/src/features/forms/adapters/browser.ts
export interface StorageHost {           // the subset of `window` the adapter reads; injectable for tests
  readonly sessionStorage?: KeyValueStore | null;
  readonly localStorage?: KeyValueStore | null;
}
export function browserStore(formId: string, host: StorageHost | null = defaultHost()): KeyValueStore | null
```

- Returns `host.sessionStorage`, or `null` when there is no window or the browser blocks storage (getter throws).
- Before returning, removes `draftKey(formId)` from `host.localStorage` (try/catch): the one-time clean-up of drafts
  written by the previous release. Harmless when nothing is there; stays in place because it costs one call per
  page load and protects every device that still holds an entry.
- `useFormWizard`: `const store = useMemo(() => browserStore(def.id), [def.id]);` (the only call site).

## Steps

- [x] **Step 1 -- Adapter (apps/app).** Modify `apps/app/src/features/forms/adapters/browser.ts`: `StorageHost`,
  `browserStore(formId, host?)` as designed, comment explaining why session storage and the clean-up. FR-01, 02, 03,
  05; NFR-01, 02.
- [x] **Step 2 -- Wire the call site.** Modify `apps/app/src/features/forms/useFormWizard.ts`: pass `def.id`,
  depend on it in `useMemo`. No other change. FR-04.
- [x] **Step 3 -- Adapter tests (apps/app, example-based).** Create
  `apps/app/src/features/forms/adapters/browser.test.ts` (node environment, fake hosts): returns the session store;
  returns `null` without a host; returns `null` when the session-storage getter throws; removes the old key from
  `localStorage` and leaves other keys; survives a `localStorage` getter that throws; a draft saved through the
  returned store lands in the session store only. FR-01, 03, 05.
- [x] **Step 4 -- Engine tests (packages/form-engine, property-based).** Modify
  `packages/form-engine/test/engine.test.ts`: in "draft on the device", add (a) PBT-02 round-trip: for generated
  drafts (realistic values: text, phone-like strings, booleans, string arrays, locality-like objects, a data-URL-like
  string; step 0..9; `neverSaved` keys drawn from the value keys), `loadDraft(saveDraft(d))` equals `d` minus the
  `neverSaved` keys when read in the same mode within 23 h; (b) PBT-03 invariant: no `neverSaved` key is ever present
  in the stored JSON or in the loaded values. Generators per PBT-07; `fc.assert` default shrinking and seed reporting
  per PBT-08. Existing example-based tests stay (PBT-10). No logic change in `src/`.
- [x] **Step 5 -- Engine comment.** Modify the header comment of `packages/form-engine/src/draft.ts`: the platform
  supplies the storage; in the browser it is the tab's session storage, so nothing outlives the tab. FR-07.
- [x] **Step 6 -- Documentation.** Modify `docs/signup/01-flow.md` "What the page keeps between visits": progress
  is kept for the tab's session only (refresh restores; closing the tab or browser clears it; a draft left by the
  previous release in `localStorage` is deleted on the next visit). FR-07.
- [x] **Step 7 -- Quality gates.** `pnpm --filter @remonta/form-engine run quality`,
  `pnpm --filter @remonta/app run quality`, `npx turbo run build`. Check `git diff --ignore-all-space --numstat` for
  regenerated Prisma clients and revert them if content-free (CLAUDE.md trap). NFR-05.
  *Result 2026-10-02: form-engine and app gates pass; `turbo run build` blocked locally by the running `next dev`
  server holding the Prisma engine (EPERM) and stopping it was not permitted -- the build is proven by CI and the
  Vercel preview. Generated Prisma files were already modified before this cycle and are not staged (see summary).*
- [x] **Step 8 -- Summary.** Write `aidlc-docs/construction/draft-storage/code/draft-storage-summary.md`: files
  modified/created, tests added, extension compliance (Security, Resiliency, PBT) at Code Generation, what Build and
  Test must verify on the preview (`requirements.md` §8).

## Extension checks at this stage

- **Security**: no secret, no logging, no endpoint; the draft never reaches a request; `neverSaved` unchanged.
  SECURITY-13: `loadDraft` keeps validating the parsed JSON. Expected: compliant / N/A, no finding.
- **Resiliency**: no deployed component changes; rollback is a one-line revert or a Vercel promote. No finding.
- **PBT (partial)**: PBT-02 and PBT-03 delivered by Step 4; PBT-07 generators realistic; PBT-08/09 fast-check with
  default shrinking and seed on failure; PBT-10 example tests retained.

## Out of plan

Anything in `features/forms/legacy/worker/`, the `legacy` switch branches, server-side expiries, other forms.
