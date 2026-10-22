# worker-tools: logical components (2026-10-22)

No new infrastructure: no queue, cache, secret, service or alert. Every piece sits in an existing component.

| Component | Unit | Package / file (planned) | Role |
|---|---|---|---|
| Tool declaration | U1 | `packages/schemas/src/data/serviceTools.ts` | `SERVICE_TOOLS`, `TOOL_IDS`, `toolServiceOf`, `normaliseOtherTools` (E1) |
| Migration | U1 | `packages/db/prisma/migrations/<date>_worker_services_tools/` + `schema.prisma` | two columns (E2) |
| Contract | U1 | `packages/api-contract/src/worker.contract.ts`, `admin.contract.ts`, `openapi.json` | E3, E4 |
| Worker handlers | U1 | `apps/api/src/modules/worker/application/sections/service-tools.ts` + `worker.handlers.ts` | Flows 1-2 through `replaceSection` |
| Admin filter row | U1 | `apps/api/src/modules/admin/application/filters.ts` + `domain/search-query.ts` | Flow 3 (one registry row) |
| Admin read | U1 | `apps/api/src/modules/admin/application/worker-services.ts` + `admin.handlers.ts` | Flow 4 |
| Docs | U1 | `docs/worker/README.md`, `docs/admin/README.md` | the entries |
| Checklist on the Services step | U2 | `apps/app` Services step + `features/worker/` | read, tick, save (N6) |
| Admin filter UI, admin page section | U2 | `apps/app` admin dashboard + `admin/contractors/[id]` | through the admin client |
| Sign-up note | U2 | `features/forms/definitions/workerRegistration.ts` + the services field | FR-10 |

Existing components relied on: the contract pipeline (auth, limits, strict validation, error mapping, audit),
`replaceSection`, the admin token route `GET /api/auth/api-token`, `createClient`, the request log and the Cloud
Monitoring policies.
