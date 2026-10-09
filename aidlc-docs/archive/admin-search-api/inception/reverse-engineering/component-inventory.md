# Component Inventory (2026-10-08)

## Application Packages
- `@remonta/app` (`apps/app`) -- the product: every journey's screens and Next.js route handlers, including the admin
  search this cycle moves. Vercel project `remonta-app`.
- `@remonta/web` (`apps/web`) -- the marketing site; reads the public worker feed. Vercel project `remontamarketplace`.
- `@remonta/api` (`apps/api`) -- the contract-driven backend on Cloud Run: sign-up, outbox, jobs, locality directory.

## Infrastructure Packages
- `@remonta/infra` (`infra/`) -- TypeScript stage table + YAML render + tests; gcloud shell scripts (bootstrap,
  alerts); alert policies; bucket lifecycle/CORS. Not CDK or Terraform.
- `.github/workflows` -- 4 quality workflows (api with PostGIS + fake GCS, app, web, infra), supply chain (report),
  CodeQL (report), Semgrep (report + a blocking `--test`), `deploy-api` (staging on merge, prod by dispatch).

## Shared Packages
- `@remonta/api-contract` -- Models/Clients: contract definitions, `meta()`, checks, typed client, OpenAPI,
  `public-endpoints.json`.
- `@remonta/form-engine` -- Models/logic: form definitions, validation from the contract, submission, drafts, photo
  staging.
- `@remonta/schemas` -- Models: Zod schemas and types shared by apps and api (`workerRegistrationSchema`,
  `image-type`, `types/auth`). Unchanged since the S1 analysis.
- `@remonta/db` -- Models: the Prisma schema, migrations, the suburb list and its refresh script. Unchanged since
  S1 except the photo cycle's rows.
- `@remonta/config` -- Utilities: tsconfig base, ESLint boundary rules P-1..P-7, Prettier.

## Test Packages
- No separate test packages. Tests live beside each package: `apps/api/test` (31 files: unit, integration against
  PostGIS, fake GCS, property-based, lint and route-security proofs), `packages/api-contract/test` (6),
  `packages/form-engine/test` (4), `infra/test` (2), plus `apps/api/load` (a burst harness).

## Total Count
- **Total Packages**: 9 workspace packages + the workflows
- **Application**: 3
- **Infrastructure**: 1 package (+ 8 workflow files)
- **Shared**: 5
- **Test**: 0 standalone (tests co-located)
