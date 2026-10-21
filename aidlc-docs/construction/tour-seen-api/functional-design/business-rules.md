# U1 `tour-seen-api`: business rules (2026-10-21)

| ID | Rule | From |
|---|---|---|
| BR-1 | **Ownership by sign-in only.** Both entries act on the profile whose `userId` is the token's subject; no request value names a profile. A WORKER token without a profile row answers **404 `WORKER_PROFILE_NOT_FOUND`** (the existing `profileNotFound`, one warn line) | Q4 A; NFR-03; `own-profile.ts` |
| BR-2 | **Workers only.** `access: { roles: ['WORKER'] }`: no token 401, an admin, client or coordinator token 403 (the pipeline's existing answers) | NFR-03 |
| BR-3 | **First time kept.** The save sets the value only when it is null; a later save returns the stored value unchanged. One statement: `UPDATE ... SET "tourSeenAt" = COALESCE("tourSeenAt", $now) ... RETURNING "tourSeenAt"`, so two saves at once still keep one time | FR-SEEN-02 |
| BR-4 | **Server clock.** `$now` is the api's injected clock (`deps.clock()`, as `putDateOfBirth`), never a client value. The save takes **no body**; a body is refused by the body limit and the contract (no `body` declared) | NFR-04 |
| BR-5 | **Audit on every save**, including a repeat (BR-3 returns the first time; the row records that the worker pressed it again). Through `replaceSection(..., { section: 'putTourSeen', completion: false })`: the same transaction as the update | Q3 A; SECURITY-13 |
| BR-6 | **Limits.** The read: `workerRead` limits (120/min per user, 300/min per IP) **without** private caching. The save: `workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 })` (60/min per user, 120/min per IP). Over a limit: 429 with `Retry-After` | NFR-05; Q5 A |
| BR-7 | **Never cached.** The read sends `cache-control: no-store` (no `privateCacheSeconds`), so a reload after a save always reads the new value | Q5 A |
| BR-8 | **The profile read is unchanged.** `GET /v1/worker/profile` and `profileSchema` do not gain the field: today's production app parses that response strictly | OI-1; NFR-02 |
| BR-9 | **Statement timeout** of the section writes (5 s, `SECTION_STATEMENT_TIMEOUT_MS`) applies to the save; the read uses the read path's timeout | NFR-01 |

## Error cases and what the app does (NFR-01: the tour never gets in the way)

| Case | Api answer | The app (U2) |
|---|---|---|
| No token / expired | 401 | No card; nothing shown |
| Not a worker | 403 | No card (the tour's code is not loaded for other roles: U2) |
| Worker without a profile row | 404 `WORKER_PROFILE_NOT_FOUND` | No card |
| Over a rate limit | 429 + `Retry-After` | Read: no card. Save: the tour still closes; not retried |
| Api down, timeout, 5xx | -- | Read: no card. Save: the tour still closes; the card may come back next visit |
| Response not matching the contract | (client throws) | Treated as the api down |
