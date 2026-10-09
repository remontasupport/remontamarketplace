# System Architecture (refresh, 2026-10-08)

Scope: `apps/api`, `packages/api-contract`, `packages/form-engine`, `infra/`, `.github/workflows`; `apps/app` only
where it calls them. Read from the code at `main` `949cf2b` (every area last changed 2026-10-05).

## System Overview

Two Next.js applications on Vercel (`apps/app` the product, `apps/web` the marketing site) and one NestJS-on-Fastify
service on Cloud Run (`apps/api`) share one Neon Postgres database (PostGIS) described by `packages/db`. The api
serves only what `packages/api-contract` declares: nine entries today, all public, all for the worker sign-up. Every
authenticated journey, the admin search included, still runs as Next.js route handlers inside `apps/app`.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Browser
        SU[Sign-up wizard<br/>form-engine + FormWizard]
        AD[Admin dashboard<br/>AdminDashboardClient.tsx]
    end
    subgraph Vercel
        APP[apps/app  Next.js 15<br/>route handlers: /api/admin/*, /api/client/*, /api/public/*, /api/suburbs]
        WEB[apps/web  marketing]
        BLOB[(Vercel Blob<br/>profile photos)]
        UP[(Upstash Redis<br/>caches, app rate limits)]
    end
    subgraph GoogleCloud["Google Cloud australia-southeast1"]
        API[apps/api  Cloud Run<br/>remonta-api / -staging]
        GCS[(Cloud Storage<br/>remonta-api-photos[-staging]<br/>private, upload-only)]
        SM[(Secret Manager)]
        MON[Cloud Monitoring + Logging]
    end
    NEON[(Neon Postgres + PostGIS<br/>prod: workerprofiles<br/>staging: rehearse-w1 copy)]
    RESEND[Resend email]
    GOOGLE[reCAPTCHA v3 / Geocoding]
    HIBP[HaveIBeenPwned]

    SU -- "createClient(registrationContract)<br/>Authorization: none (public)" --> API
    SU -- signed POST policy --> GCS
    AD -- "fetch /api/admin/contractors" --> APP
    APP --> NEON
    APP --> UP
    APP -- geocode the typed suburb --> GOOGLE
    API --> NEON
    API --> GCS
    API --> RESEND
    API -- siteverify --> GOOGLE
    API -- k-anonymity --> HIBP
    API -- clean copy + thumbnail --> BLOB
    API -. reads at start .-> SM
    API -- pino JSON --> MON
    WEB -- "/api/public/workers" --> APP
```

## Component Descriptions

### apps/api (Application, Cloud Run)
- **Purpose:** the contract-driven backend. One Fastify handler per contract entry, built by `buildRouteHandler`;
  Nest is used only for lifecycle (`app.ts`: an empty `AppModule`, a `ContractOnlyAdapter`). No controllers (lint +
  Semgrep + a boot check).
- **Responsibilities:** the pipeline (headers, shedding, HTTPS, CORS, body limit, rate limit, CAPTCHA, auth, role,
  validation, handler, response shaping, audit); the outbox dispatcher; the scheduler (reconciler, photo purge,
  outbox retention, rate-limit purge); the sign-up transactions; the locality directory.
- **Dependencies:** `@remonta/api-contract`, `@remonta/schemas`, a Prisma client generated from `packages/db`'s
  schema (copied by `scripts/prisma-schema.mjs`), `@google-cloud/storage`, `@vercel/blob`, `sharp`, `bcryptjs`.
- **Type:** Application.

### packages/api-contract (Model)
- **Purpose:** `defineContract` + `meta()` + `checkContracts` + `createClient` + `toOpenApi`; two contracts
  (`platform`, `registration`); `public-endpoints.json`; `openapi.json` with a drift test.
- **Dependencies:** `@remonta/schemas`, `zod` 4. **Boundary P-6** forbids Nest, Fastify, Prisma, Next, React, Node
  built-ins.

### packages/form-engine (Model / client logic)
- **Purpose:** `defineForm`, field kinds, validation from the contract entry's body schema, request mapping,
  `submitToApi` with retries honouring `Retry-After` and a fresh CAPTCHA token per attempt, the device draft
  (`neverSaved` keys stripped), email-code verification, `stagePhoto` (ticket, direct upload, confirm).
- **Dependencies:** `@remonta/api-contract`, `@remonta/schemas`, `zod`. **Boundary P-7** forbids React, Next,
  react-hook-form, Nest, Prisma, Node built-ins.

### infra (Infrastructure)
- **Purpose:** `lib/stages.ts` (the one table) rendered to `cloudrun/service.<stage>.yaml` (drift-checked); six
  alert policies applied by `apply-alerts.sh`; `bootstrap.sh` (APIs, registry with cleanup, runtime and deploy
  service accounts, Workload Identity Federation restricted to `refs/heads/main`, six secrets per stage, log
  metrics, buckets with lifecycle and CORS).
- **Type:** Infrastructure (gcloud shell + TypeScript render, no CDK/Terraform).

### apps/app (Application, Vercel) -- as the caller
- Holds the admin search today (`src/app/api/admin/contractors/route.ts`) and the sign-up page that renders the
  form engine (`features/forms/`); its NextAuth JWT cookie (`SameSite=Lax`, the app's host) never reaches the api.

## Data Flow

### Worker sign-up (live)

```mermaid
sequenceDiagram
    participant B as Browser (form-engine)
    participant A as apps/api
    participant G as Cloud Storage
    participant D as Neon
    participant O as Outbox / jobs
    B->>A: POST /v1/registrations/worker/email-codes (captcha)
    A-->>B: 202 signed ticket (HMAC, 10 min); email sent via Resend
    B->>A: POST .../email-codes/verify
    B->>A: POST .../photo-tickets {type,size}
    A-->>B: 201 signed POST policy (10 min, 5 MB, type-bound)
    B->>G: POST file
    B->>A: POST .../photo-confirmations {id}
    A->>G: inspect size, first 16 bytes
    A->>D: registration_photo_uploads row
    B->>A: POST /v1/registrations/worker (captcha, code proof, localityId, services, photoUploadId)
    A->>D: one transaction: users, worker_profiles (+legacy location columns), worker_services, worker_locations HOME, worker_onboarding (+transition), audit_logs, outbox_events
    A-->>B: 202 (same body for a new or an existing email)
    O->>D: WorkerRegistered -> confirmation email; PhotoUploaded -> sharp clean copy to Blob, profile.photos, staging object deleted
```

### Admin worker search (today, in apps/app; the subject of this cycle)

```mermaid
sequenceDiagram
    participant UI as Admin page
    participant R as apps/app route /api/admin/contractors
    participant U as Upstash
    participant GG as Google Geocoding
    participant D as Neon
    UI->>R: GET ?location="Parramatta, NSW 2150"&within=10&filters...
    R->>U: response cache (60 s, keyed on the sorted query)
    R->>GG: geocode the label (cached 24 h); miss => no distance filter, silently
    R->>D: findMany {id, lat, lng} inside a bounding box on worker_profiles.latitude/longitude + every filter
    R->>R: Haversine in JS, sort, slice the page
    R->>D: findMany the page's ids with the full select
    R-->>UI: {data, pagination, appliedFilters}
```

### Request pipeline in apps/api (every entry)

```
onRequest: x-request-id -> security headers -> load shedding (503, unless probe) -> HTTPS (403, unless probe) -> CORS
route:     body limit (413) -> ip/global rate limits (429; limiter down => 503) -> CAPTCHA (403/503) ->
           authenticate (401; DenyAll today) -> role (403) -> per-user limits -> validate params/query/body (400) ->
           handler(req, ctx{requestId, ip, principal, rawBody, log, audit}) -> response schema (500 on drift) ->
           audit required? (500 if not recorded) -> cache-control
```

## Integration Points

- **External APIs:** Google reCAPTCHA v3 siteverify (api, fails closed); Google Geocoding (`apps/app` search routes,
  key `GEOMAP_API`); HaveIBeenPwned range API (api, k-anonymity); Resend (api, idempotency keys); Vercel Blob (api
  clean copies, `apps/app` dashboard uploads); n8n/Zoho (absent from the api; `N8N_REGISTRATION_WEBHOOK_URL` only
  allow-listed).
- **Databases:** one Neon Postgres per stage. Prod `workerprofiles` (host `ep-delicate-recipe-a7mbt4ef`); staging
  the `rehearse-w1` branch. PostGIS 3.5, `au_localities` and `worker_locations` with GiST-indexed geography points.
  **No PostGIS SQL exists anywhere in `apps/api` yet** (only Prisma reads of `au_localities`); this cycle writes the
  first.
- **Third-party services:** Cloud Run, Secret Manager, Artifact Registry, Cloud Storage, Cloud Monitoring/Logging;
  Vercel (hosting, Blob); Upstash Redis (`apps/app` and `apps/web` only).

## Infrastructure Components

- **Cloud Run services** (`infra/lib/stages.ts`): `remonta-api-staging` (1 instance, 512 Mi, CORS
  `https://*.vercel.app`, bucket `remonta-api-photos-staging`) and `remonta-api` (1-4 instances, 1 Gi, CORS
  `https://app.remontaservices.com.au`, bucket `remonta-api-photos`); both CPU always allocated, concurrency 80,
  timeout 60 s, gen2, startup/liveness probes on `/v1/health`, runtime service account `<service>-run@`.
- **Deployment model:** merge to `main` touching the api path builds `remonta/api:<sha>` (SBOM + provenance) and
  replaces the staging service; production is a `workflow_dispatch` promotion of an existing image (`deploy-api.yml`);
  rollback = dispatch an older sha or route traffic to a previous revision. WIF keyless auth, `main` only.
- **Networking:** public ingress, invoker IAM disabled, no VPC connector, no custom domain, no WAF; HTTPS enforced
  by the api behind `TRUST_PROXY=1`.
- **Secrets:** `remonta-api[-staging]-<NAME>`, six per stage, mounted as `latest`, read at start (a new version needs
  a new revision).
- **Alerts** (prod): instance-down, outbox-dead-letter, 5xx-ratio, latency-p95 (true p95 AND 60+ requests per 5 min
  window, 10 min), request-failed, will-not-start; staging: the first two. All to `support@remontaservices.com.au`.
