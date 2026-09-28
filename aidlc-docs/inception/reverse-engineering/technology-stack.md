# Technology Stack (current, in-scope)

## Programming Languages
- TypeScript ^5: all apps and packages
- SQL: Prisma migrations, raw SQL in `api/admin/filters` and the client dashboards

## Frameworks
- Next.js 15.5.7 (App Router, route handlers, server actions): `apps/app`, `apps/web`
- React / React DOM 19.1.0: UI
- NextAuth 4.24 (Credentials, JWT): authentication in `apps/app`
- Prisma 6.16 (+ `@prisma/extension-accelerate` for the legacy client): ORM
- Zod 4.1: validation (`packages/schemas`)
- TanStack React Query: client data fetching (`apps/app`)

## Infrastructure
- Vercel: hosting for both apps, Vercel Cron (1 job), Vercel Blob (public file storage)
- Neon Postgres: application DB (`AUTH_DATABASE_URL`, pooled via PgBouncer; `DIRECT_DATABASE_URL` for migrations)
- Postgres (contractor directory): `DATABASE_URL`, used by `apps/web` and 2 `apps/app` routes
- Upstash Redis (REST): cache, rate limiting, the login cache
- Resend: email
- Google Geocoding API, Nominatim: geocoding
- Twilio (raw REST): SMS (unreachable)
- n8n: outbound webhooks
- Zoho CRM: recruitment-lead sync
- Pusher: realtime (`apps/app`; not in scope)
- reCAPTCHA: bot protection (not effective today)

## Build Tools
- pnpm 9.15.9: package manager, workspaces
- Turborepo ^2.10: task orchestration
- `scripts/check-baseline.mjs`: quality baselines
- GitHub Actions: CI quality checks only (Node 20.x / 22.x matrix), `pnpm audit`, cdxgen SBOM

## Testing Tools
- Vitest ^2.1.9: unit tests (`apps/app` only)
- fast-check ^4.9.0: property-based tests (3 files)
- k6: load scripts

## Not present (relevant to the new service)
- No NestJS, Fastify, BullMQ, ioredis, AWS SDK, Docker or IaC tool anywhere. `apps/api` introduces all of them.
