# Dependencies (2026-10-08)

## Internal Dependencies

```mermaid
flowchart BT
    config[@remonta/config]
    schemas[@remonta/schemas]
    db[@remonta/db]
    contract[@remonta/api-contract] --> schemas
    engine[@remonta/form-engine] --> contract
    engine --> schemas
    api[@remonta/api] --> contract
    api --> schemas
    api -. schema copy, not a package import .-> db
    app[@remonta/app] --> contract
    app --> engine
    app --> schemas
    app --> db
    web[@remonta/web] --> schemas
    infra[@remonta/infra]
    contract -. dev .-> config
    engine -. dev .-> config
    api -. dev .-> config
    infra -. dev .-> config
```

### `@remonta/api` depends on `@remonta/api-contract`
- **Type:** Runtime (bundled by tsup). **Reason:** the contracts, `checkContracts`, `routeOf`, `ERROR_CODES`,
  `RATE_WINDOWS`, `Role`, the response schemas.

### `@remonta/api` depends on `@remonta/schemas`
- **Type:** Runtime. **Reason:** `workerRegistrationSchema` family and `image-type` (accepted MIME types, header
  sniffing), imported by subpath to avoid the index's tracked type errors.

### `@remonta/api` depends on `@remonta/db` (indirectly)
- **Type:** Build. **Reason:** `scripts/prisma-schema.mjs` copies `packages/db/prisma/schema.prisma` and generates a
  client into `apps/api/generated/db` (`#db` import). The api never imports the `@remonta/db` package; the
  migrations are run by `packages/db` (`migrate:deploy`).

### `@remonta/form-engine` depends on `@remonta/api-contract`
- **Type:** Runtime. **Reason:** `createClient`, entry types, `meta.bot` for the captcha action, `localitySchema`
  shape, `PHOTO_MAX_BYTES`. Only four files import it (`form.ts`, `submit.ts`, `types.ts`, `verification.ts`).

### `@remonta/app` depends on `@remonta/api-contract` and `@remonta/form-engine`
- **Type:** Runtime (client bundle). **Reason:** the sign-up wizard (`features/forms/*`, 14 files import the engine;
  3 adapters and the definition import the contract directly for the locality and category clients). The admin page
  imports neither: it calls its own Next.js routes with `fetch`.

### `@remonta/infra`
- **Type:** standalone. Depends on nothing in the workspace at runtime; its tests read `.github/workflows/deploy-api.yml`
  and `cloudrun/lib.sh` to cross-check names.

### Boundaries enforced
- P-6 (`packages/config/eslint.boundaries.mjs:140-176`): api-contract may not import Nest, Fastify, Express, Prisma,
  `@remonta/db`, Next, React, Node built-ins. Proven by `packages/api-contract/test/boundary.test.ts` (7 rejections).
- P-7 (`:179-208`): form-engine may not import React, react-dom, react-native, react-hook-form, Next, Nest, Prisma,
  `@remonta/db`, Node built-ins. Proven by `packages/form-engine/test/boundary.test.ts`.
- P-1/P-2: `apps/web` may not import `@remonta/db` or `@prisma/client` (ESLint + Semgrep `remonta-web-no-database-import`).
- Semgrep `remonta-no-raw-fetch-to-api`: apps and the engine may not `fetch` the api by hand.

## External Dependencies

| Dependency | Version | Purpose | License |
|---|---|---|---|
| fastify | 5.11.3 | HTTP server | MIT |
| @fastify/cors, @fastify/multipart | ^11.1.0, ^9.3.0 | CORS allow-list; multipart parsing (bounded) | MIT |
| @nestjs/core, @nestjs/common, @nestjs/platform-fastify | ^11.1.6 | Lifecycle shell | MIT |
| reflect-metadata, rxjs | ^0.2.2, ^7.8.2 | Nest peer requirements | Apache-2.0 |
| @prisma/client, prisma | ^6.16.2 | ORM and migrations | Apache-2.0 |
| zod | ^4.1.11 | Schemas everywhere | MIT |
| @google-cloud/storage | ^7 | Bucket adapter, V4 POST policies via IAM signBlob | Apache-2.0 |
| @vercel/blob | ^2.8.0 | Clean photo copies | Apache-2.0 |
| sharp | ^0.34 | Image re-encode | Apache-2.0 |
| bcryptjs | ^3.0.3 | Password hashing | MIT |
| pino | ^10.3.1 (dev; Fastify bundles the runtime copy) | JSON logging | MIT |
| yaml | ^2.8.1 | infra render | ISC |
| vitest | ^2.1.9 | Tests | MIT |
| fast-check | ^4.9.0 | Property-based tests | MIT |
| tsup, @swc/core, unplugin-swc, tsx | ^8.5.0, ^1.13.5, ^1.5.7, ^4.23.13 | Build and run TypeScript | MIT |
| eslint, @typescript-eslint/parser, typescript | ^9, ^8, ^5 | Lint and types | MIT / Apache-2.0 |
| semgrep/semgrep (container) | 1.179.0 | Code scanning | LGPL-2.1 (tool) |
| postgis/postgis, fsouza/fake-gcs-server (images) | 16-3.4, 1.52.2 | Test infrastructure | PostgreSQL / BSD-2 |

Supply-chain notes: `pnpm audit` runs report-only (`|| true`), with two criticals recorded in the workflow
(`@auth/core`, `jspdf`, both apps/app); cdxgen floats at `@^11`; GitHub Actions are pinned by tag, not SHA; the api
base image and Semgrep are pinned exactly.
