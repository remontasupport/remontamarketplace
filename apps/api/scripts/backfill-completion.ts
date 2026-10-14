// pnpm --filter @remonta/api backfill:completion [-- --apply --allow-production --report=<file> --batch=<n>]
//
// U1 worker-area (R3.9, P14): the persisted completion (`setupProgress`, `profileCompleted`,
// and NOT_STARTED -> IN_PROGRESS) for every worker, from the same rules the profile read
// uses. Dry run by default; `--apply` writes; idempotent. Reads STAGING_AUTH_DATABASE_URL
// when set (the staging run of the runbook), else apps/api/.env's DIRECT_DATABASE_URL /
// AUTH_DATABASE_URL. A production host is refused unless `--allow-production` is given.
import { backfillCompletion, formatCompletionReport } from '../src/modules/worker/backfill'
import { runBackfill } from './backfill-cli'

/** The production Neon hosts (scripts/local/dev-env.sh, CLAUDE.md). */
export const PRODUCTION_HOST_PATTERNS = [/ep-delicate-recipe/, /ep-polished-thunder/]

export function isProductionHost(url: string): boolean {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return false
  }
  return PRODUCTION_HOST_PATTERNS.some((p) => p.test(host))
}

/** The guard (U1-SEC-08): a problem string, or null when the run may proceed. */
export function productionGuard(url: string | undefined, argv: readonly string[]): string | null {
  if (!url) return 'no database URL: set STAGING_AUTH_DATABASE_URL or DIRECT_DATABASE_URL / AUTH_DATABASE_URL'
  if (isProductionHost(url) && !argv.includes('--allow-production')) return 'the database URL is production\'s; pass --allow-production to run there (after the staging run)'
  return null
}

const entry = process.argv[1] ?? ''
if (/backfill-completion\.ts$/.test(entry)) {
  if (process.env.STAGING_AUTH_DATABASE_URL) process.env.DIRECT_DATABASE_URL = process.env.STAGING_AUTH_DATABASE_URL
  const url = process.env.DIRECT_DATABASE_URL || process.env.AUTH_DATABASE_URL
  const problem = productionGuard(url, process.argv)
  if (problem) {
    console.error(`backfill-completion: ${problem}`)
    process.exit(2)
  }
  await runBackfill('backfill-completion', (db, opts) => backfillCompletion(db, { apply: opts.apply, batch: opts.batch, onProgress: opts.onProgress }), formatCompletionReport)
}
