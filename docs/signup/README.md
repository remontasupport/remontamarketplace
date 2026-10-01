# Worker sign-up — documentation index

The worker sign-up at `/registration/worker`: the flow, every API it calls, what it writes to the
database, and the enums involved. Written from the code on 2026-10-01 (after PR #22). When the code and
this folder disagree, the code wins; fix this folder in the same PR.

## Where to look

| I need to know… | File | Section |
|---|---|---|
| The steps a worker goes through, and which call each step makes | [01-flow.md](01-flow.md) | §2 Step by step |
| Legacy vs new api, and what decides which one runs | [01-flow.md](01-flow.md) | §1 Two backends |
| The base URLs (staging / production) | [02-api-reference.md](02-api-reference.md) | §1 Base URLs |
| The error format and every error code | [02-api-reference.md](02-api-reference.md) | §2 Errors |
| Rate limits, reCAPTCHA, CORS, caching per endpoint | [02-api-reference.md](02-api-reference.md) | §3 Summary table |
| One endpoint's parameters, response and errors | [02-api-reference.md](02-api-reference.md) | §4 Endpoints |
| The sign-up body's fields and their validation rules | [02-api-reference.md](02-api-reference.md) | §4.7 Submit |
| Which tables a sign-up writes, and every column it sets | [03-data-model.md](03-data-model.md) | §2 Tables written |
| Which tables the sign-up only reads | [03-data-model.md](03-data-model.md) | §3 Tables read |
| What the legacy sign-up writes | [03-data-model.md](03-data-model.md) | §5 Legacy |
| Any enum (role, status, onboarding stage, outbox status…) | [04-enums.md](04-enums.md) | one section per enum |
| What happens after the sign-up: emails, outbox events, retries, audit | [05-events-and-emails.md](05-events-and-emails.md) | |

## Source files (where the truth lives)

| Topic | File |
|---|---|
| Endpoints, parameters, responses, limits | `packages/api-contract/src/registration.contract.ts` |
| Sign-up body validation | `packages/schemas/src/schema/workerRegistrationSchema.ts` |
| Error shape and codes | `packages/api-contract/src/errors.ts` |
| Request pipeline (rate limit, captcha, validation…) | `apps/api/src/platform/pipeline/pipeline.ts` |
| Handlers | `apps/api/src/modules/registration/registration.handlers.ts` |
| The sign-up transaction | `apps/api/src/modules/registration/application/register-worker.ts` |
| Photo staging | `apps/api/src/modules/registration/application/stage-photo.ts` |
| Email codes | `apps/api/src/modules/registration/application/email-code.ts`, `domain/email-code.ts` |
| Service catalogue | `apps/api/src/modules/registration/application/service-categories.ts` |
| Location placement | `apps/api/src/modules/locations/domain/home.ts` |
| Onboarding stage rule | `apps/api/src/modules/onboarding/domain/stage.ts` |
| Outbox and retries | `apps/api/src/platform/outbox/outbox.ts`, `dispatcher.ts` |
| Emails | `apps/api/src/modules/notifications/` |
| Tables and enums | `packages/db/prisma/schema.prisma` (+ hand-written SQL in `packages/db/prisma/migrations/`) |
| The form (steps and fields) | `apps/app/src/features/forms/definitions/workerRegistration.ts` |
| The backend switch | `apps/app/src/lib/registration-switch.ts`, `apps/app/src/app/registration/worker/page.tsx` |
| Generated API inventory | `packages/api-contract/openapi.json` (regenerate: `pnpm --filter @remonta/api-contract openapi`) |
