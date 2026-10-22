# Build instructions: onboarding-tour (2026-10-21)

- **Tools:** Node 20 or 22, pnpm (workspace), Turborepo; Prisma 6. Windows: stop the local api/app before a build
  (`EPERM` on the query engine, CLAUDE.md).
- **Secrets:** `apps/app/.env`, `apps/app/.env.local`, `apps/api/.env` (from the backup; CLAUDE.md "New machine").

```bash
pnpm install                                        # postinstall regenerates the app's Prisma clients
pnpm --filter @remonta/api run prisma:generate      # the api's own client (also run by its quality and build)
pnpm --filter @remonta/app run db:generate          # after a schema change; never commit the result
npx turbo run build                                 # apps/app, apps/web, packages
```

- **U1** (`apps/api`, `packages/api-contract`, `packages/db`) builds from `main`; the image is built by `deploy-api`
  on the merge (staging) and promoted by dispatch (production).
- **U2** (`apps/app`) builds on `feat/onboarding-tour` (Vercel preview per push).
- **Expected:** `Tasks: N successful`; `✓ Compiled successfully`. **Acceptable noise:** Prisma's "tips", pg's SSL-mode
  warning, the LF/CRLF notices.
- **Trap met in this cycle:** the committed app Prisma client is deliberately old; a worktree holding it fails the app
  type gate on branches that use newer columns (`homeStreetLine`, `passwordChangedAt`). Fix: `db:generate`, then
  leave the regenerated files uncommitted (`git checkout -- apps/app/src/generated apps/web/src/generated` before a
  commit if anything was staged).
