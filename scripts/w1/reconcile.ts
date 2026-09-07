/**
 * W1 reconcile — rebuild the four typed tables for every worker, THROUGH THE
 * SAME CODE the application runs on each save.
 *
 * Two jobs:
 *
 *  1. Before the dual-write deploy, run this against a Neon branch. It is the
 *     only thing that actually executes src/lib/w1/promote.ts. Typechecking is
 *     not running: the enum casts, createMany with array columns and the
 *     slot parsing are all unproven until this has run once.
 *
 *  2. After the dual-write deploy, run it against production to close the gap
 *     between the initial backfill and the deploy — any profile edited in
 *     between has a stale derived copy until this runs.
 *
 * Safe to re-run. Each worker is rebuilt from the Json columns inside its own
 * transaction, with the source row locked, and the Json columns are never
 * modified. Rebuilding from source is always correct while the Json remains the
 * source of truth, which it does until W1 phase P7.
 *
 * Usage:
 *   npx tsx scripts/w1/reconcile.ts                              dry run
 *   npx tsx scripts/w1/reconcile.ts --confirm                    execute
 *   npx tsx scripts/w1/reconcile.ts --url-var REHEARSAL_DATABASE_URL --confirm
 *
 * Exit codes: 0 ok · 1 failure · 2 refused
 */

import { PrismaClient } from '../../src/generated/auth-client'
import {
  rebuildJobHistory,
  rebuildEducation,
  rebuildAvailability,
  rebuildExperience,
} from '../../src/lib/w1/promote'

const { describe, loadEnv } = require('../rehearsal/endpoints')

const ROOT = require('path').resolve(__dirname, '..', '..')

const argOf = (flag: string, dflt: string): string => {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}

type Totals = { jobHistory: number; education: number; availability: number; experience: number }

async function main(): Promise<number> {
  loadEnv(ROOT)
  const confirmed = process.argv.includes('--confirm')
  const urlVar = argOf('--url-var', 'DIRECT_DATABASE_URL')
  const url = process.env[urlVar]
  if (!url) {
    console.error(`ERROR: ${urlVar} is not set in .env or .env.local`)
    return 1
  }

  const target = describe(url)
  console.log('')
  console.log(`  TARGET: ${target?.production ? 'PRODUCTION' : 'branch/copy'}  —  ${target?.label}`)
  console.log(`  endpoint ${target?.endpoint}  database ${target?.database}`)
  console.log('')

  // Same rule as the backfill: production writes take a second, explicit act.
  if (confirmed && target?.production && !process.argv.includes('--production')) {
    console.error('  REFUSING TO RUN.')
    console.error('  --confirm against a production endpoint also requires --production.')
    console.error('')
    return 2
  }

  // Measured, not assumed: two runs over the pooler died partway through, at
  // workers 200 and ~180, with "Can't reach database server" and "Server has
  // closed the connection". Individual transactions are fine over PgBouncer —
  // some 1,500 operations succeeded each time — but holding one client through
  // 381 sequential transactions is not what a pooler is for, and a half-finished
  // batch is worse than a refused one.
  if (target?.pooled) {
    console.error('  REFUSING TO RUN — this is a pooled connection.')
    console.error('')
    console.error('  A pooled connection drops partway through a long batch. Use the')
    console.error('  direct endpoint for reconcile; the pooler is for the app, whose')
    console.error('  transactions are short and one per request.')
    console.error('')
    console.error('  Remove "-pooler" from the hostname, or use the direct URL var.')
    console.error('')
    return 2
  }

  const prisma = new PrismaClient({ datasources: { db: { url } } })

  // Refuse to run against a database whose schema is behind this code.
  //
  // Both of today's failures had this shape: production ran code expecting
  // String columns while the database still had INTEGER, and later the
  // rehearsal branch did the same. In both cases the write simply failed and
  // the derived tables sat empty — no message pointed at the cause, so the
  // symptom was "my save did not appear" and the diagnosis took a detour.
  //
  // Comparing what the code expects against what is applied turns that into
  // one line.
  {
    const fs2 = require('fs') as typeof import('fs')
    const path2 = require('path') as typeof import('path')
    const dir = path2.join(ROOT, 'prisma', 'migrations')
    const local: string[] = fs2
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()

    const appliedRows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`
    const applied = new Set(appliedRows.map((r) => r.migration_name))
    const pending = local.filter((m) => !applied.has(m))

    if (pending.length) {
      await prisma.$disconnect()
      console.error('  REFUSING TO RUN — the database schema is behind this code.')
      console.error('')
      console.error('  Migrations this code expects but the database does not have:')
      for (const m of pending) console.error(`    - ${m}`)
      console.error('')
      console.error('  Writing now would fail on every column those migrations change,')
      console.error('  and the derived tables would look empty for no visible reason.')
      console.error('')
      console.error(
        target?.production
          ? '  Apply them first:  npm run db:migrate:deploy'
          : '  Apply them first:  npm run branch:migrate',
      )
      console.error('')
      return 2
    }
  }

  const workers = await prisma.workerAdditionalInfo.findMany({
    select: {
      id: true,
      workerProfileId: true,
      jobHistory: true,
      education: true,
      availability: true,
      experience: true,
    },
    orderBy: { id: 'asc' },
  })
  console.log(`  source rows: ${workers.length} worker_additional_info`)
  console.log('')

  if (!confirmed) {
    console.log('  DRY RUN — nothing written. Add --confirm to execute.')
    console.log('  A dry run cannot exercise promote.ts, which is the point of')
    console.log('  running this: use --confirm against a branch.')
    await prisma.$disconnect()
    return 0
  }

  const totals: Totals = { jobHistory: 0, education: 0, availability: 0, experience: 0 }
  const skipped: string[] = []
  let done = 0

  for (const w of workers) {
    try {
      await prisma.$transaction(async (tx) => {
        // Lock the source row: a rebuild from a stale read could otherwise
        // overwrite a concurrent save once dual-write is live.
        await tx.$queryRaw`SELECT id FROM worker_additional_info WHERE id = ${w.id} FOR UPDATE`

        const jh = await rebuildJobHistory(tx, w.id, w.jobHistory)
        const ed = await rebuildEducation(tx, w.id, w.education)
        const av = await rebuildAvailability(tx, w.workerProfileId, w.availability)
        const ex = await rebuildExperience(tx, w.workerProfileId, w.experience)

        totals.jobHistory += jh.written
        totals.education += ed.written
        totals.availability += av.written
        totals.experience += ex.written

        for (const [scope, r] of [
          ['jobHistory', jh], ['education', ed], ['availability', av], ['experience', ex],
        ] as const) {
          for (const s of r.skipped) skipped.push(`${scope}: ${s}`)
        }
      }, {
        // Prisma closes an interactive transaction after 5s by default, and
        // this body makes up to nine round trips — a lock, four deletes and
        // four inserts. One slow worker then fails with "Transaction not
        // found", which reads like a bug rather than a timeout. Generous here
        // because a reconcile is a batch job with nobody waiting on it.
        timeout: 60_000,
        maxWait: 20_000,
      })
    } catch (err) {
      await prisma.$disconnect()
      console.error(`\n  FAILED on worker_additional_info ${w.id}: ${(err as Error).message}`)
      console.error('  That worker rolled back. Earlier workers are committed;')
      console.error('  re-run to continue — this script is idempotent.')
      return 1
    }
    done++
    if (done % 50 === 0 || done === workers.length) {
      process.stdout.write(`  ${done}/${workers.length}\r`)
    }
  }

  console.log('\n')
  console.log('  written:')
  for (const [k, v] of Object.entries(totals)) console.log(`    ${k.padEnd(14)} ${v}`)

  if (skipped.length) {
    const byReason: Record<string, number> = {}
    for (const s of skipped) {
      const key = s.replace(/entry \d+/, 'entry N')
      byReason[key] = (byReason[key] || 0) + 1
    }
    console.log('')
    console.log(`  SKIPPED — ${skipped.length}:`)
    for (const [reason, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(4)}  ${reason}`)
    }
  } else {
    console.log('\n  No skips.')
  }

  const actual = {
    jobHistory: await prisma.workerJobHistory.count(),
    education: await prisma.workerEducation.count(),
    availability: await prisma.workerAvailability.count(),
    experience: await prisma.workerExperience.count(),
  }

  console.log('')
  console.log('  in-table totals:')
  let bad = 0
  for (const k of Object.keys(totals) as (keyof Totals)[]) {
    const ok = actual[k] === totals[k]
    if (!ok) bad++
    console.log(
      `    ${ok ? 'ok  ' : 'MISS'} ${k.padEnd(14)} ${String(actual[k]).padStart(6)}  written ${totals[k]}`,
    )
  }

  await prisma.$disconnect()
  if (bad) {
    console.error(`\n  ${bad} table(s) do not match. Investigate before proceeding.`)
    return 1
  }
  console.log('\n  Reconcile complete. promote.ts executed for every worker.')
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
