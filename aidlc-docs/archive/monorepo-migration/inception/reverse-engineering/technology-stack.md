# Technology Stack

**System**: Remonta Marketplace
**Analysis Date**: 2026-09-09T02:12:02Z

---

## Programming Languages

| Language | Version | Usage |
|---|---|---|
| **TypeScript** | ^5 | The entire application — 452 source files, ~134,200 lines. Strict compilation is **not enforced at build time** (`typescript.ignoreBuildErrors: true`). |
| **TSX** | — | 163 React components plus 54 pages. |
| **JavaScript** | ES2015+ | k6 load tests, PostCSS and ESLint config files. |
| **SQL** | PostgreSQL dialect | Prisma migrations and `prisma/legacy-sql/`. |
| **Prisma Schema Language** | — | Two schemas, 32 models, 10 enums. |

---

## Frameworks

| Framework | Version | Purpose |
|---|---|---|
| **Next.js** | 15.5.7 | App Router, routing, SSR and RSC, API route handlers, Server Actions, middleware, image optimisation. Turbopack in development. |
| **React** | 19.1.0 | UI rendering, Server and Client Components. |
| **React DOM** | 19.1.0 | DOM renderer. |
| **NextAuth.js** | ^4.24.11 | Authentication, JWT sessions, credentials provider. **v4, not the v5 line** — relevant to any future framework change. |
| **Prisma** | ^6.16.2 | ORM, migrations, type generation for two databases. |
| **React Hook Form** | ^7.63.0 | Form state, bound to Zod through `@hookform/resolvers`. |
| **TanStack Query** | ^5.90.5 | Server-state caching, 8 query hooks. |
| **SWR** | ^2.3.6 | A second server-state library used alongside TanStack Query. |
| **Zustand** | ^5.0.8 | Client state, onboarding store. |

---

## UI and Styling

| Technology | Version | Purpose |
|---|---|---|
| **Tailwind CSS** | ^4 | Primary styling, via `@tailwindcss/postcss`. |
| **Radix UI** | various | Accessible headless primitives behind `src/components/ui` — checkbox, dialog, label, popover, progress, radio-group, select, slot. |
| **MUI** (`@mui/material`, `@mui/x-date-pickers`) | ^7.3.6 / ^8.23.0 | A second component system, primarily date pickers. |
| **Headless UI** | ^2.2.8 | A third headless primitive set. |
| **styled-components** | ^6.1.19 | CSS-in-JS runtime. |
| **Emotion** (`@emotion/react`, `@emotion/styled`) | ^11 | A second CSS-in-JS runtime, required by MUI. |
| **Heroicons** | ^2.2.0 | Icons. |
| **Lucide React** | ^0.544.0 | A second icon set. |
| **cmdk** | ^1.1.1 | Command palette. |
| **react-day-picker** | ^9.13.0 | Calendar. |
| **class-variance-authority**, **clsx**, **tailwind-merge** | — | Class composition, the shadcn/ui convention. |
| **tw-animate-css** | ^1.4.0 | Animation utilities. |
| **@chatscope/chat-ui-kit-react** | ^2.1.1 | Chat UI for the admin chatbot. |
| **react-easy-crop** | ^5.5.5 | Image cropping during photo upload. |

> Four overlapping UI primitive systems (Radix, MUI, Headless UI, chatscope) and three styling
> approaches (Tailwind, styled-components, Emotion) coexist. See `code-quality-assessment.md`,
> finding TD-7.

---

## Data and Persistence

| Technology | Version | Purpose |
|---|---|---|
| **PostgreSQL** | — | Two separate databases: `AUTH_DATABASE_URL` (live domain, 24 models) and `DATABASE_URL` (Zoho mirror, 8 models). |
| **PgBouncer** | — | Connection pooling. Migrations bypass it via `DIRECT_DATABASE_URL`. |
| **@prisma/client** | ^6.16.2 | Two generated clients: the default one, and `src/generated/auth-client`. |
| **@prisma/extension-accelerate** | ^3.0.1 | Optional query acceleration on the legacy database. |
| **pg** | ^8.20.0 | Raw PostgreSQL driver alongside Prisma. |
| **Upstash Redis** | ^1.35.6 | Response caching and rate-limit counters over HTTP — serverless-appropriate. |
| **Vercel Blob** | ^2.0.0 | Document, certificate and photo storage. |

---

## Integrations

| Service | Library | Purpose |
|---|---|---|
| **Zoho CRM** | `axios` | Lead sync inbound, service requests outbound. OAuth 2 refresh-token grant. |
| **Resend** | ^6.1.2 | Transactional email. |
| **Nodemailer** | ^6.10.1 | A second email transport. |
| **React Email** (`@react-email/render`) | ^1.3.1 | Email template rendering. |
| **Twilio** | REST via fetch | SMS OTP. No SDK dependency — called directly. |
| **Google reCAPTCHA** | direct | Registration bot protection. |
| **Pusher** / **pusher-js** | ^5.3.2 / ^8.4.0 | Realtime. **Declared but no active server usage found.** |
| **n8n** | webhooks | Admin AI search, admin chat, application routing. |
| **Geocoding** (`GEOMAP_API`) | direct | Suburb and address to coordinates. |

---

## Document Generation

| Technology | Version | Purpose |
|---|---|---|
| **@react-pdf/renderer** | ^4.3.1 | Worker profile and code-of-conduct PDFs. |
| **jsPDF** | ^3.0.4 | A second PDF path. |
| **html-to-image** | ^1.11.13 | DOM to raster, feeding the jsPDF path. |

---

## Utilities

| Technology | Version | Purpose |
|---|---|---|
| **Zod** | ^4.1.11 | Runtime validation for requests and forms. |
| **bcryptjs** | ^3.0.2 | Password hashing. |
| **date-fns** | ^4.1.0 | Date manipulation. |
| **dayjs** | ^1.11.19 | A second date library, required by MUI date pickers. |
| **axios** | ^1.13.2 | HTTP client, coexisting with native `fetch`. |

---

## Infrastructure

| Service | Purpose |
|---|---|
| **Vercel** | Hosting, serverless functions, edge middleware, CDN, image optimisation. |
| **Vercel Cron** | One hourly job invoking `/api/cron/sync-jobs`. |
| **Vercel Blob** | Object storage. |
| **Upstash** | Serverless Redis. |
| **PostgreSQL (managed)** | Two databases, reached over the public internet through a pooler. |

> **No infrastructure-as-code.** No CDK, Terraform, CloudFormation, Docker or compose
> definitions exist. Infrastructure is defined by `vercel.json` plus Vercel dashboard
> configuration, which means environment and resource configuration is not version-controlled.

---

## Build Tools

| Tool | Version | Purpose |
|---|---|---|
| **npm** | — | Package management. Single package, no workspaces. |
| **Turbopack** | bundled with Next 15 | Development bundler. |
| **TypeScript compiler** | ^5 | Type checking. **Not enforced during builds.** |
| **PostCSS** | via `@tailwindcss/postcss` | CSS pipeline. |
| **tsx** | ^4.23.13 | Runs the operational TypeScript scripts. |
| **Prisma CLI** | ^6.16.2 | `generate`, `migrate`, `studio`. Run twice per build, once per schema. |

---

## Code Quality Tools

| Tool | Version | Purpose | Enforced? |
|---|---|---|---|
| **ESLint** | ^9 (flat config) | Linting via `eslint-config-next` | **No** — `eslint.ignoreDuringBuilds: true` |
| **Prettier** | ^3.6.2 | Formatting, with `prettier-plugin-tailwindcss` for class sorting | Yes, on staged files |
| **Husky** | ^9.1.7 | Git hooks | Yes |
| **lint-staged** | ^16.2.0 | Runs Prettier pre-commit | Yes |
| **TypeScript** | ^5 | Type safety | **No** — `typescript.ignoreBuildErrors: true` |

---

## Testing Tools

| Tool | Version | Purpose |
|---|---|---|
| **k6** | external binary | Load, smoke and stress testing — 5 scripts under `tests/load/`. |

> **No unit or integration testing framework is installed.** There is no Jest, Vitest, Testing
> Library, Playwright or Cypress dependency. k6 is not an npm dependency and must be installed
> separately. Combined with disabled type and lint enforcement, the project has **no automated
> gate that can fail a deployment**. See `code-quality-assessment.md`, finding TD-3.

---

## CI/CD

| Element | State |
|---|---|
| **CI pipeline** | None. No `.github/workflows`, no GitLab CI, no CircleCI configuration. |
| **CD** | Vercel Git integration, implied by `vercel.json`. |
| **Pre-commit** | Husky plus lint-staged running Prettier only — formatting, not correctness. |
| **Quality gates** | None that can block a merge or deploy. |

---

## Environment Configuration

35 environment variables are referenced across the codebase.

| Group | Variables |
|---|---|
| **Databases** | `AUTH_DATABASE_URL`, `DIRECT_DATABASE_URL`, `DATABASE_URL`, `ACCELERATE_DATABASE_URL` |
| **Auth** | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| **Zoho** | `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ACCOUNTS_URL`, `ZOHO_CRM_API_URL` |
| **Redis** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Email** | `RESEND_API_KEY`, `EMAIL_FROM` |
| **SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_DEV_MODE` |
| **reCAPTCHA** | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` |
| **Machine-to-machine** | `CRON_SECRET`, `SYNC_API_SECRET` |
| **Webhooks** | `AI_SEARCH_WEBHOOK`, `APPLY_WEBHOOK_URL`, `N8N_WEBHOOK_URL` |
| **Other** | `GEOMAP_API`, `NEXT_PUBLIC_BASE_URL`, `REMONTA_API_URL`, `NODE_ENV`, `VERCEL_ENV`, `VERCEL_URL` |

> The scan also matched four single-letter fragments (`process.env.A`, `.C`, `.R`, `.S`), which
> are dynamic property access rather than real variable names.

> `.env` and `.env.local` are present in the working tree. `.gitignore` should be confirmed to
> exclude them before any repository restructuring moves files around.
