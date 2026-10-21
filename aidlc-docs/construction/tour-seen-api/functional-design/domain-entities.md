# U1 `tour-seen-api`: domain entities (2026-10-21)

Answers: `construction/plans/tour-seen-api-functional-design-plan.md` Q1-Q5 (all A).

## E1 `worker_profiles.tourSeenAt` (Q1 A)

| | |
|---|---|
| Table | `worker_profiles` (Prisma `WorkerProfile`) |
| Column | `"tourSeenAt" TIMESTAMP(3)`, nullable, no default, no index (read only by the profile's own `userId`, which is already unique) |
| Null means | The worker has not seen the tour: every existing row starts null, so every worker sees it once (D2) |
| A value means | The first time the worker started-and-ended the tour or pressed Not now (D3), by the api's clock |
| Written by | `PUT /v1/worker/tour/seen` only. Never by the sign-up, the backfills, the reconciler or an admin entry |
| Not touched | `updatedAt` (seeing the tour is not a profile change), the completion flags, the legacy columns |

**Migration** `YYYYMMDDHHMMSS_tour_worker_profiles_tour_seen_at` (the timestamp set at code generation), in the style of
`20261016120000_u5d_users_password_changed_at`: a header comment (what, why, expand-only, rollback) and
`ALTER TABLE "worker_profiles" ADD COLUMN "tourSeenAt" TIMESTAMP(3);`, with a `down.sql` that drops it. Expand-only:
no data change, no lock beyond the catalogue update; the previous api image ignores the column (NFR-08).

## E2 `TourView` (the response of both entries, Q2 A)

```ts
z.strictObject({ seenAt: z.iso.datetime({ offset: true }).nullable() })
```

`seenAt`: the stored value as ISO 8601 with offset, or `null`. Nothing else is sent (strict, as every worker shape).

## E3 The audit row (Q3 A)

The existing `AuditAction.PROFILE_UPDATE`, written by `replaceSection` with metadata
`{ section: "putTourSeen", profileId, impersonatorId? }`. No value is stored in the row (as for every section write).
No change to the `AuditAction` enum.
