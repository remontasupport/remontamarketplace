# Unit Test Execution -- cycle *admin worker search on apps/api*

## Run

```bash
pnpm --filter @remonta/api-contract run test
pnpm --filter @remonta/api run test            # set TEST_DATABASE_URL (localhost) and GCS_API_ENDPOINT to include the gated suites
pnpm --filter @remonta/infra run test
pnpm --filter @remonta/app run test            # PR 3, 4
```

`vitest` prints the results to the console; there is no report file. CI runs the same commands in `API Quality`
(with PostGIS and the fake bucket), `Infra Quality` and `App Quality`.

## Expected, per PR

| Package | Before this cycle (2026-10-05) | After PR 1 (measured 2026-10-08) | After PR 2 | After PR 3 |
|---|---|---|---|---|
| `@remonta/api-contract` | 35 | **39** (+4: `test/auth.test.ts`) | + the admin contract, `privateCacheSeconds`, `canonicalQueryOf` | -- |
| `@remonta/api` | 404 (128 gated) | **437: 309 passed + 128 skipped locally** (+31: `test/auth/jwt-authenticator.test.ts` 27, `test/auth/attribution.test.ts` 4; +1 in `config.test.ts`; `route-security.test.ts` unchanged at 69 with the fixture extracted) | + the admin module, the geo properties (gated), the memo and cache step | -- |
| `@remonta/infra` | 37 | **40** (+3: the `auth-failed` policy and the prod/staging lists) | -- | -- |
| `@remonta/app` | 86 | 86 | -- | + the token route, the token source, the wrapper, the URL round trip |

Property-based tests use `fast-check`; on a failure the seed is printed by the framework (`Seed`, `Counterexample`)
and can be replayed with `fc.assert(..., { seed })`. None is excluded from CI.

## Fixing failures

1. Read the failing file and case name in the vitest output.
2. Reproduce with `pnpm --filter <pkg> exec vitest run <file>`.
3. Fix the code (not the test) unless the design says the test is wrong; cite the rule (R#) or property (P#, G#)
   in the commit message.
4. Re-run the package's `quality`, then `npx turbo run build`.
