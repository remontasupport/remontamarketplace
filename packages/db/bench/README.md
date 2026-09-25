# Query benchmark (S1, 2026-09-25)

Seeds a **separate** local database with 100,000 workers (users, profiles and
onboarding markers) and 500,000 verification_requirements. It then times the
queries that matter at that scale: best of 5 runs, execution time only.

```bash
docker exec remonta-s1-pg psql -U postgres -c "create database bench template template0"
# AUTH_DATABASE_URL = DIRECT_DATABASE_URL = postgresql://postgres:postgres@localhost:55432/bench
npx prisma migrate deploy --schema=prisma/schema.prisma
docker exec -i remonta-s1-pg psql -U postgres -d bench < bench/seed-100k.sql
docker exec -i remonta-s1-pg psql -U postgres -d bench < bench/queries.sql
```

Never point it at a shared database: it inserts 800,000 rows.

## Results at 100,000 workers

| Query | Before | After the planned indexes |
|---|---|---|
| **Sign-in, as apps/app does it today** (`mode: "insensitive"` → `ILIKE`) | **47 ms, full scan of users** | 0.009 ms via `users (lower(email))` |
| Dashboard: profile by user; a worker's documents | 0.008–0.009 ms | — |
| Admin backlog (oldest 50 DOCUMENTS_SUBMITTED) | 0.02 ms | — |
| Admin: stuck in SIGNED_UP > 7 days | 1.0 ms | — |
| Admin: workers per stage | 8.8 ms (a full count; cache it if shown often) | — |
| Reconciler change scan (every 5 min) | 61 ms, full scans | **1.6 ms** with indexes on the change columns |
| Reconciler: workers without a marker | 28 ms | fine at a 5-minute interval |

Findings:
- The sign-in lookup cannot use an index today. It costs database CPU on every sign-in and grows with the number of users.
- `users.email` carries three indexes: the unique one plus two duplicates.
