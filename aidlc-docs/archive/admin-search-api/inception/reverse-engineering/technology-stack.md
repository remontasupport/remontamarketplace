# Technology Stack (2026-10-08)

## Programming Languages
- TypeScript 5 (strict in api, api-contract, form-engine, infra, schemas, web; baselined errors tolerated in app) --
  everything
- JavaScript -- `hash-worker.js` (worker thread), `load/burst.js`, ESLint configs
- SQL -- Prisma migrations (hand-written PostGIS, CHECK constraints, partial indexes), raw tagged-template queries
- Bash -- `infra/cloudrun/*.sh`, `.github/scripts/api-health.sh`, `scripts/setup-new-machine.sh`
- YAML -- Knative Service manifests (generated), GitHub workflows

## Frameworks
- Fastify 5.11.3 -- the api's HTTP server (pinned)
- NestJS 11.1 -- lifecycle shell only (no controllers; `ContractOnlyAdapter`)
- Next.js 15 / React 19 -- apps/app and apps/web (per the S1 analysis)
- NextAuth (JWT strategy) -- apps/app sessions
- Prisma 6.16 -- ORM over Neon; `Unsupported("geography(Point, 4326)")` for the PostGIS columns
- Zod 4.1 -- schemas, env validation, OpenAPI generation, form validation
- react-hook-form + `@hookform/resolvers` -- the form wizard glue in apps/app (outside the engine)

## Infrastructure
- Google Cloud Run (australia-southeast1, gen2, CPU always allocated) -- `remonta-api`, `remonta-api-staging`
- Google Artifact Registry -- `remonta/api:<sha>`, newest 20 tagged kept, 90-day tagged retention
- Google Secret Manager -- six secrets per stage, regional replication
- Google Cloud Storage -- `remonta-api-photos[-staging]`, private, upload-only, 1-day `staging/` lifecycle
- Google Cloud Monitoring and Logging -- six alert policies, five log metrics, 90-day retention
- Workload Identity Federation -- keyless deploys from `refs/heads/main`
- Neon Postgres 16 + PostGIS 3.5 -- prod `workerprofiles`, staging `rehearse-w1` copy
- Vercel -- hosting for both apps, Blob storage for profile photos, Preview/Production env scopes
- Upstash Redis -- apps/app caches and rate limits (apps/web has an in-memory fallback)
- Resend -- transactional email
- Google reCAPTCHA v3 (classic key) -- bot check on the sign-up entries
- Google Geocoding API -- the apps/app search routes (key `GEOMAP_API`); not used by the api

## Build Tools
- pnpm 9.15.9 workspaces, Turborepo (`turbo.json`, `envMode: loose`)
- tsup 8.5 + @swc/core 1.13 -- api bundle (ESM, node20)
- Docker buildx (linux/amd64, SBOM + provenance) -- the api image, node 22.23.3-bookworm-slim by digest
- `pnpm deploy --prod --config.node-linker=isolated` -- production dependency pruning in the image
- ESLint 9 (flat config, `@remonta/config` boundary rules), Prettier
- Semgrep 1.179.0 (container), CodeQL (security-extended), cdxgen 11 (SBOM)

## Testing Tools
- Vitest 2.1 -- every package (`fileParallelism: false` in the api)
- fast-check 4.9 -- property-based tests (api domain and policies, form-engine, hosts)
- postgis/postgis:16-3.4 -- the integration database (CI service container, local Docker)
- fsouza/fake-gcs-server 1.52.2 -- the bucket for photo tests
- ESLint-in-tests -- `lint.test.ts` and the two `boundary.test.ts` prove the guards reject
- A burst load harness (`apps/api/load`) -- manual
