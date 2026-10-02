# Execution Plan -- remove the legacy worker sign-up path

## Detailed Analysis Summary

- **Transformation Type**: Single-purpose removal across two packages (`apps/app`, `packages/form-engine`); no
  infrastructure, data model or api change.
- **Primary Changes**: delete the legacy page, its two routes and helpers, the switch, and the engine's legacy mode;
  the page renders the api wizard or an "unavailable" card.
- **User-facing changes**: none for production users (the api wizard is what they already get). The pre-S1 page
  can no longer be served.
- **Risk Level**: Medium. Deletions are mechanical, but the engine refactor edits files the live api path shares.
  Mitigated by the request-equality tests, a full preview sign-up and a seconds-long Vercel rollback.
- **Rollback Complexity**: Easy (Vercel promote; the api is untouched).
- **Testing Complexity**: Moderate (unit tests rewritten for one mode; the preview protocol in
  `requirements.md` §5).

## Phases

### 🔵 INCEPTION
- [x] Workspace Detection (COMPLETED 2026-10-02)
- [x] Reverse Engineering (REPLACED by the targeted inventory `legacy-signup-removal-inventory.md`)
- [x] Requirements Analysis (COMPLETED 2026-10-02, standard depth; questions + clarification answered)
- [x] User Stories (SKIPPED: technical debt removal, no new behaviour for users)
- [x] Workflow Planning (this document)
- [ ] Application Design -- SKIP (no new component; one small `SignupUnavailable` card and one pure resolver replace
  the switch)
- [ ] Units Generation -- SKIP (one unit, `legacy-removal`; the two packages change in one PR because the engine's
  type change and the app's use of it must land together)

### 🟢 CONSTRUCTION
- [ ] Functional / NFR / Infrastructure Design -- SKIP (specified by FR-01..08 and §5)
- [ ] Code Generation -- EXECUTE: `aidlc-docs/construction/plans/legacy-removal-code-generation-plan.md`
- [ ] Build and Test -- EXECUTE: gates, static proof, PR, preview protocol, merge, production check, manual
  Upstash/Vercel clean-up

## Package Change Sequence (one PR)
1. `packages/form-engine`: types, kinds, form, draft, submit; tests.
2. `apps/app`: deletions; definition; page + resolver + card; hook, glue, adapters, fields; auth-prisma; tests.
3. Docs: CLAUDE.md, `docs/signup/*`, state file.

## Success Criteria
- The verification protocol of `requirements.md` §5 passes on the preview and on production.
- `rg` finds no reference to the deleted modules, the switch, or a legacy branch (NFR-02).
- Baselines shrink or stay; no new finding.
