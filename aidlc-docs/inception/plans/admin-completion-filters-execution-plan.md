# Admin completion filters -- execution plan (2026-11-09)

Branch for the record: `aidlc/admin-completion-filters` (from `aidlc/search-locations`). Code: `feat/...` from `main`.

## Units
| Unit | Branch | Scope | Release |
|---|---|---|---|
| **U1 `completion-filters-api`** | `feat/completion-filters-api` | `packages/api-contract` (four query fields, `withCompletion`, the row's optional `completion`, `openapi.json`); `apps/api` (four `FILTERS` rows from one helper, the select of `setupProgress`, `shapeRow`); tests; `docs/admin/README.md` | PR -> staging -> preview checklist -> **promotion** |
| **U2 `completion-filters-app`** | `feat/completion-filters-app` | `apps/app` admin dashboard: four dropdowns, the card badges, `withCompletion=true`, the CSV columns | after U1 is on prod; PR -> preview -> merge |

## Reuse (CS-1..CS-5)
- Reuses: the filter registry, the contract's enum/flag helpers, `parseStoredFlags`' reading (one SQL helper for the
  four flags, not four copies), the dashboard's existing filter dropdowns and URL handling, `features/admin-export`.
- Adds: one enum `COMPLETION_FILTERS = ['complete', 'incomplete']` and one list of the four flag keys, shared by the
  contract and the api.

## Stages
| Stage | Decision |
|---|---|
| Reverse engineering | SKIP (targeted inventory in the requirements) |
| User stories | SKIP (one actor, the admin) |
| Application design | SKIP (no new component) |
| Functional design | Light, inside each unit's code plan (FR-2's reading; the badge wording) |
| NFR | Existing baselines; PBT for FR-2 |
| Code generation | U1, then U2 |
| Build and test | Gates per CLAUDE.md; CI API Quality for the database tests (Docker is down here) |

## Extensions (carried from the last cycle; re-confirm)
Security baseline blocking; Resiliency baseline blocking; Property-based testing full.

## Pending outside this cycle
U7 (the column drop) stays recommended and pending.
