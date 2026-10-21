# Unit test instructions: onboarding-tour (2026-10-21)

```bash
pnpm --filter @remonta/api-contract run quality    # the tour entries, no-cache read, round-trip property
pnpm --filter @remonta/api run quality             # apps/api/test/worker/tour.test.ts (10, two properties)
pnpm --filter @remonta/app run quality             # the tour's 42 tests (below); baselines must not grow
```

| Unit | Files | Tests |
|---|---|---|
| U1 | `packages/api-contract/test/worker.test.ts` (tour block), `worker.sections.test.ts` (entry count) | 6 + 1 changed |
| U1 | `apps/api/test/worker/tour.test.ts` (the pipeline on an in-memory stand-in) | 10 |
| U2 | `apps/app/src/features/worker/tour.api.test.ts` | 5 |
| U2 | `src/features/navigation/tourSteps.test.ts` | 6 |
| U2 | `src/features/onboarding-tour/{machine,tourApi,rules}.test.ts` | 8 + 12 + 11 |

Properties (`fast-check`, PBT full): U1 first-time-kept, no cross-worker change, `TourView` round-trip; U2 the
reducer as a stateful model, every target resolves, the retry delay, `nextShowable`, the card always on screen.
