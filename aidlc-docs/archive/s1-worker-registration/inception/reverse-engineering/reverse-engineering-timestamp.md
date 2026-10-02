# Reverse Engineering Metadata

**Analysis Date:** 2026-09-25T05:42:58Z
**Analyzer:** AI-DLC. Four parallel read-only code agents (identity/auth, registration/onboarding, compliance/notifications, data/platform); findings consolidated by the lead analyst. H1 was re-verified by direct reading.
**Workspace:** `C:\Users\toton\Desktop\New folder\Remonta`
**Git HEAD at analysis:** `8e530c1` ("Provider agreement: update to v3"); `origin/main` = `25eb04e` (the same code, plus merge commit #10)
**Mode:** **targeted refresh** (OI-09, execution plan). In scope: the six first-release domains + platform, plus out-of-scope code that reads in-scope tables. Business behaviour is taken from `.brd/` (2026-09-23), not re-derived.
**Supersedes:** the technical artifacts in `aidlc-docs/archive/monorepo-migration/inception/reverse-engineering/` (2026-09-09, HEAD `c541580`, pre-monorepo paths, 186 commits ago) for the in-scope domains.
**Scope analysed:** `apps/app` (86 route handlers, 11 server-action modules; the in-scope subset is listed in `api-documentation.md`), `packages/db`, `packages/schemas`, `packages/config`, CI and Vercel config. No code was executed and no database was touched.

## Artifacts Generated
- [x] business-overview.md (summary; the full version is `.brd/`)
- [x] architecture.md
- [x] code-structure.md
- [x] api-documentation.md (includes the switch-over map and the regression surface)
- [x] component-inventory.md
- [x] technology-stack.md
- [x] dependencies.md
- [x] code-quality-assessment.md
- [x] security-findings.md (extra: live production exposures)

## Questions resolved
- **Which Prisma schema is the source of truth:** `packages/db/prisma/schema.prisma` (the application DB, `AUTH_DATABASE_URL`, migrations in `packages/db/prisma/migrations`). The other three are the legacy contractor-directory schemas (`apps/app`, `apps/web`) and a never-generated design reference (`schema.target.prisma`).

## Open items raised
- Two databases, with an unfinished consolidation (D-34/D-35). The unverified fallback in `lib/prisma.ts` may point the legacy client at the auth DB
- The U8 summary says 7 migrations; 5 folders exist
- Where the Prisma client lives for two consumers (`apps/app` + `apps/api`): the `packages/db` README U9 options → decide in Application Design
