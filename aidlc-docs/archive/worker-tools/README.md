# Worker tools for Cleaning and Home & Yard Maintenance (cycle closed 2026-10-22)

**Goal (user, 2026-10-22):** "I want to add a lists of a cleaning tools and yard and maintenance tools to the worker's
dashboard if their services have cleaning and yard and maintenance"; then (same day) a word search on the admin's Tools
filter, "I want the search to be accurate".

## What shipped (all live 2026-10-22)

| PR | Content |
|---|---|
| #104 `c523f53` | U1 `tools-api`: the two lists (14 cleaning, 15 yard) in `packages/schemas`; `worker_services."toolIds"`/`"otherTools"` (expand-only); `GET/PUT /v1/worker/services/.../tools`; `tools` on the admin search (all of); `GET /v1/admin/workers/:id/services`. Promoted 04:44Z |
| #105 `8ef704d` | U2 `tools-app`: the "Your tools" screen after the certificate (the Languages field unchanged, 5 own x 60), the admin Tools filter, the tools line on the worker's admin page (not in the JPEG), the sign-up note, the auth client refreshed |
| #106 `bf9b966` | Tool search api: one shared matcher (`toolSearchOf`), the approved synonyms, `toolSearch` on the admin search. Promoted 07:44Z |
| #107 `8943f93` | The Tools filter per type of support, above Experience with; the search box (narrows with the api's matcher, "Also matches") |

Reference: `docs/worker/README.md` (Service tools, the tools screen), `docs/admin/README.md` (`tools`, `toolSearch`,
`getWorkerServices`, the app side), `docs/signup/01-flow.md`.

## Deviations

See `construction/build-and-test/build-and-test-summary.md`: #105 merged before the promotion (about 50 minutes of a
failing admin Tools filter and an unloadable tools screen); the wrong Prisma-client claim in U1 (checked harmless); the
JPEG exclusion; one synonym dropped; revision names not read (gcloud).

## Layout

`inception/` (inventory, requirements + questions, execution plan), `construction/` (tools-api: functional design +
the tool-search addendum, code summary; tools-app: functional design, code summary; shared NFR design; plans;
build-and-test), `aidlc-state-at-close.md`. The audit trail stays in `aidlc-docs/audit.md`.
