# Branch Topology and Product Boundaries

**Analysis Date**: 2026-09-09T02:12:02Z
**Why this artifact exists**: the stated driver for the monorepo migration is that two products
are being maintained as two long-lived branches of one repository. This documents that situation,
because it is the actual problem the restructure has to solve — and it is not visible from any
single working tree.

---

## The Two Products

| | `main` | `app/main` |
|---|---|---|
| **Product** | Marketing website | Web application |
| **CMS** | Sanity (`sanity.config.ts`, `sanity/`, `/studio` route) | None |
| **Source files under `src`** | 231 | 460 |
| **Database** | `DATABASE_URL` — marketing database | `AUTH_DATABASE_URL` — application database |
| **Prisma schema** | `schema.prisma`, 3 models | `auth-schema.prisma`, 24 models (+ a stale copy of `schema.prisma`, 8 models) |
| **Migrations** | 2, for the marketing schema | 5, for the auth schema only |
| **Last commit at analysis** | `9a09ac2`, 2026-08-31 | `c541580`, 2026-09-09 |
| **Deployment** | Separate Vercel project | Separate Vercel project |

Confirmed with the user on 2026-09-09: **the two databases are physically separate.** There is no
shared-database hazard.

### Distinct page surfaces

**`main` (marketing)**: `/`, `/landing`, `/services`, `/policy`, `/contact`, `/newsroom`,
`/newsroom/[slug]`, `/area/[slug]`, `/provide-support`, `/support-coordinators`, `/search`,
`/search-workers`, `/find-support`, `/studio`, `/workers/[id]`, `/registration/{user,worker,support-coordinator}`

**`app/main` (application)**: 54 pages across `/dashboard/worker`, `/dashboard/client`,
`/dashboard/supportcoordinators`, `/admin`, `/apply`, `/registration`, `/share`, plus auth and
recovery routes.

---

## Divergence

```
                                    148 commits
                        main  o--o--o--o--o--o--o--o  (2026-08-31)
                             /
  e15ecdb  o---o---o---o---o   merge base, 2025-10-17
                             \
                    app/main  o--o--o--o--o--o--o--o  (2026-09-09)
                                    381 commits
```

| Measure | Value |
|---|---|
| Merge base | `e15ecdb` — "Fix Zoho API date format for webhook sync" |
| Merge base date | **2025-10-17** |
| Time diverged | **~11 months** |
| Commits on `main` only | **148** |
| Commits on `app/main` only | **381** |
| Both actively developed | **Yes** — 9 days apart at analysis |

This is not a feature branch awaiting merge. It is two products that forked and kept going.

### Related branch sprawl

The repository carries **36 local branches**, including 22 prefixed `app/main-*` (feature
branches off the application product) and several marketing-side branches (`landingPage-v2`,
`landingPageRevision`, `main-landingPage-V2`, `findSupportPage`, `findSupport-v2`,
`main-backup`). Ten branches exist on `origin`. Branch naming is currently the only signal of
which product a branch belongs to.

---

## Shared Surface and Its Drift

Ten API endpoints exist on both branches. **Nine have diverged.**

| Endpoint | Status |
|---|---|
| `/api/contractors/[id]` | identical |
| `/api/contractors` | **diverged** |
| `/api/articles` | **diverged** |
| `/api/geocode` | **diverged** |
| `/api/jobs` | **diverged** |
| `/api/public/workers` | **diverged** |
| `/api/suburbs` | **diverged** |
| `/api/sync-jobs` | **diverged** |
| `/api/refresh-jobs` | **diverged** |
| `/api/cron/sync-jobs` | **diverged** |

`prisma/schema.prisma` also exists on both and has diverged by **322 lines** (176 insertions, 146
deletions): `main` declares 3 models, `app/main` declares 8.

Endpoints unique to `main`: `articles/featured`, `contractors-by-area`, `send-contact`,
`send-feedback`, `sync-contractors`, `test-zoho`, `webhooks/zoho-contractor`, `zoho/authorize`,
`zoho/callback`.

> `zoho/authorize` and `zoho/callback` live **only** on the marketing branch. The OAuth
> authorisation flow for the Zoho integration is therefore owned by the marketing product, while
> both products consume Zoho. This ownership should be settled explicitly during the migration.

---

## Actual Cross-Product Coupling

The schema divergence looks alarming but is mostly dead declaration. Measured coupling:

| Direction | Mechanism | Volume |
|---|---|---|
| `app/main` → marketing database | `@/lib/prisma` legacy client | **2 files, 3 queries, 1 model** (`contractorProfile`) |
| `app/main` → auth database | `@/lib/auth-prisma` | 94 files |

The three queries are in `src/app/api/contractors/route.ts` (`findMany`, `count`) and
`src/app/api/contractors/[id]/route.ts` (`findFirst`). Their only UI consumer is
`SearchSupport.tsx`, rendered by the unprotected `/remontaadmin/findsupport` page — see
`code-quality-assessment.md` finding TD-5.

The five extra models on `app/main`'s `schema.prisma` (`Document`, `Category`, `Subcategory`,
`CategoryDocument`, `SubcategoryDocument`) are never queried through the legacy client; the same
concepts live in `auth-schema.prisma` and are used via `authPrisma`. That is why `app/main` has no
migrations for them.

**So the genuine cross-product dependency is one contractor-search integration**, not a tangled
data layer. That makes the separation far cheaper than the raw diff suggests.

---

## Implications for the Migration

1. **Do not merge the branches.** Reconciling 148 against 381 commits of 11-month divergence
   would be expensive and would produce nothing that importing them separately does not. Bring
   each in as its own package with history preserved (`git subtree` or `git filter-repo`).

2. **Branch consolidation is the payoff.** Once both products live in one tree, the nine drifted
   endpoints and the duplicated schema become one owned copy each. The drift stops by
   construction rather than by discipline.

3. **Two separate projects, currently conflated.**
   - *Monorepo consolidation* is justified by this branch problem. Bounded and immediately
     valuable.
   - *Backend extraction* is justified by the mobile application, not by the branch problem. It
     is a much larger job — 56 Server Actions with no HTTP surface, 17 pages querying Prisma
     inline, and NextAuth v4 requiring token-based auth (see `dependencies.md`).

   Attempting both at once means restructuring packages while changing transport, across two
   products, with no type checking or tests. Land the monorepo first.

4. **Settle Zoho integration ownership** — the OAuth flow currently lives only on the marketing
   branch while both products consume Zoho.

5. **Branch naming stops being the product boundary.** Directory structure replaces it, and the
   36-branch sprawl can be pruned against real package boundaries.

---

## Candidate Target Structure

Offered as a starting point for Requirements Analysis, not a decision.

```
remonta/
├── apps/
│   ├── marketing/          # from main — Sanity site
│   ├── web/                # from app/main — the application
│   └── mobile/             # later, once a backend HTTP surface exists
├── packages/
│   ├── db-marketing/       # schema.prisma + marketing migrations
│   ├── db-app/             # auth-schema.prisma + auth migrations
│   ├── contracts/          # shared types and Zod schemas
│   ├── integrations/       # Zoho, geocoding, email, SMS — today duplicated
│   └── ui/                 # only if the two products should share components
└── ...
```

Open questions for Requirements Analysis:
- Should the two products share a UI package, or stay visually independent?
- Which product owns the Zoho integration and its OAuth flow?
- Does the contractor-search integration stay a cross-database call, or does the data move?
- Is the mobile application in scope now, or a later phase gated on backend extraction?
