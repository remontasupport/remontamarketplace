# PR 1 -- api-identity, api side + infra (generated 2026-10-08)

Branch `feat/api-identity` from `main` `949cf2b`. PR: #PR_NUMBER. Plan: `../../plans/api-identity-code-generation-plan.md`
(Parts 0, A, B, C, D ticked; Part E, the app side, is generated with PR 3).

## Files

**Created**
- `packages/api-contract/src/auth.ts` -- claims schema, constants (`API_TOKEN_ISSUER`, `API_TOKEN_AUDIENCE`, `API_TOKEN_TTL_S = 300`, `API_TOKEN_ALG = 'HS256'`, `API_TOKEN_KID = 'current'`, `API_TOKEN_KID_PREVIOUS = 'previous'`), `principalOf`
- `packages/api-contract/test/auth.test.ts` -- constants pinned, mapping, strictness (P4), a round-trip property
- `apps/api/src/platform/auth/jwt-authenticator.ts` -- `JwtAuthenticator` (R3), `MAX_TOKEN_LENGTH`, `RejectionReason`
- `apps/api/test/fixtures/private-contract.ts` -- the synthetic ADMIN entry, extracted from `route-security.test.ts`
- `apps/api/test/auth/jwt-authenticator.test.ts` -- 27 tests: 4 accepts, 18 rejection cases, cookie/query ignored, P1, P2, P3, P7
- `apps/api/test/auth/attribution.test.ts` -- 4 tests through the pipeline with the real verifier
- `infra/cloudrun/monitoring/auth-failed.json` -- the policy of the infrastructure design, section 4
- `docs/admin/README.md` -- the token: claims, lifetime, pairing rule, rejections, impersonation, lags, minting by hand, saved queries

**Modified**
- `packages/api-contract/src/index.ts` (export), `package.json` (`fast-check` dev)
- `apps/api/package.json` (`jose` ^6.2.12), `.env.example` (the pair), `src/config/config.ts` (the pair), `src/main.ts` (the verifier wired with a logger getter), `src/platform/auth/authenticator.ts` (`impersonatorId?`), `src/platform/pipeline/pipeline.ts` (the refusal line with the entry; the attributed child logger), `test/helpers.ts` (`authenticator?`), `test/config.test.ts` (fixture + the pair's rules), `test/route-security.test.ts` (uses the fixture)
- `infra/lib/stages.ts` (eight names), `cloudrun/service.{staging,prod}.yaml` (regenerated), `cloudrun/bootstrap.sh` (secrets, step 4b, the metric), `cloudrun/lib.sh` (`auth-failed` on prod), `test/cloudrun.test.ts`, `test/monitoring.test.ts`, `README.md` (the secret section with both runbooks)
- `CLAUDE.md` (the pairing line), `pnpm-lock.yaml` (two importer entries only)

## Decisions taken during generation

| # | Decision | Why |
|---|---|---|
| G1 | The refusal is logged twice: the authenticator logs `{auth:'rejected', reason}`, the pipeline logs `{entry, auth:'rejected'}` | the port keeps its one-method signature; the metric filter requires `reason`, so it counts once |
| G2 | A `kid` naming a key the instance does not hold (unknown, or `previous` with none configured) is `malformed`, not `bad-signature` | no signature was checked; the reason must say so |
| G3 | The verifier takes a logger getter | Fastify's logger exists only after `createApp`; the verifier is built before |
| G4 | `API_TOKEN_SECRET_PREVIOUS` is optional in config | local `.env` files carry one secret; on Cloud Run both are always mounted (bootstrap seeds the previous) |
| G5 | The lockfile keeps `unplugin-swc`'s vite peer on 5.4.21 | both `pnpm install` and `pnpm add` re-resolve it to the hoisted vite 7, which breaks `vitest.config.ts`'s types; the two packages already existed in the lockfile, so only importer entries were added |
| G6 | `jose` pinned `^6.2.12` (what `pnpm add` wrote) | the version the lockfile already resolves transitively |

## Gates (local, 2026-10-08)

| Gate | Result |
|---|---|
| `@remonta/api-contract` quality | 39 tests (35 + 4) |
| `@remonta/api` quality | lint, strict tsc, 309 passed / 128 skipped (DB- and bucket-gated, CI runs them) |
| `@remonta/infra` quality | 40 tests (37 + 3), `render:check` clean |
| `turbo run build` | 3/3 |
| Prisma noise | regenerated clients reverted after each install; `git diff --ignore-all-space --numstat` = 196 content lines, all intended |

## What the staging checklist must prove (deployment-architecture section 2, step 5)

- The service boots (the secret is in place) -- "apps/api listening"; health 200.
- Every public entry unchanged: a sign-up on a preview works end to end.
- A hand-minted token (`docs/admin/README.md`) is accepted on PR 2's entries (or, before PR 2, the proof is CI's
  attribution test); a tampered one answers 401 with `bad-signature` in Cloud Logging.
- Production unchanged.

## Stories

US-AS-14 (verify every token) and US-AS-10 (impersonation refused) implemented and tested; US-AS-17's U1 part
(attributed log, the metric and alert) implemented; US-AS-18's PR 1 steps ready for the operator. US-AS-08 and
US-AS-09 follow with PR 3.
