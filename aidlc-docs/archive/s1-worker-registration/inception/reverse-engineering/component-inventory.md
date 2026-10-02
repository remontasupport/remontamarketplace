# Component Inventory

## Application Packages
- `apps/app` (`@remonta/app`): the application (Next.js 15). 86 route handlers, 11 server-action modules. **Source of every in-scope domain today**
- `apps/web` (`@remonta/web`): the marketing site (Next.js 15). 20 route handlers, its own contractor DB. Out of scope

## Infrastructure Packages
- None. No IaC exists; Vercel is configured through `apps/*/vercel.json` only

## Shared Packages
- `packages/db` (`@remonta/db`): Models. Prisma schema + migrations for the application DB; no runtime export
- `packages/schemas` (`@remonta/schemas`): Models. Zod schemas and types; depends only on zod (P-5)
- `packages/config` (`@remonta/config`): configuration. tsconfig, ESLint incl. P-1..P-5, Prettier

## Test Packages
- None as separate packages. Tests live in `apps/app/src/**/*.test.ts` (6 files, unit + PBT) and `apps/app/tests/load/` (k6)

## Other schema files (not packages)
- `apps/app/prisma/schema.prisma`: legacy contractor-directory schema (3 models, `DATABASE_URL`)
- `apps/app/prisma/schema.target.prisma`: design reference, never generated (the unbuilt W2/W3 and WorkerBankAccount)
- `apps/web/prisma/schema.prisma`: the marketing app's own contractor-directory schema (3 models)

## Total Count
- **Total Packages:** 5
- **Application:** 2
- **Infrastructure:** 0
- **Shared:** 3
- **Test:** 0
