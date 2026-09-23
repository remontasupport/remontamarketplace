/**
 * Back up, delete and restore the REAL (non-FAKE) rows in the jobs table.
 *
 * ⚠️  These are live job listings. Deleting them removes them from the worker
 * dashboard for every worker on the real site, not just locally.
 *
 * WHY A BACKUP EXISTS RATHER THAN A BARE DELETE
 *
 * Two reasons. First, they are production data and a delete with no way back is
 * a bad trade for a testing convenience. Second, the restore path is genuinely
 * useful: /api/cron/sync-jobs runs hourly and upserts by zohoId, so the rows
 * return on their own within the hour — but "within the hour" is not the same
 * as "now", and if something needs them back immediately, this does it.
 *
 * THE ONE THING TO KNOW
 *
 * Deleting is NOT permanent in effect. The hourly Zoho sync (vercel.json cron
 * "0 * * * *") re-creates every deleted row from its source. A dashboard showing
 * only fake jobs will quietly repopulate with real ones at the top of the hour.
 * Run `delete` again, or pause the cron, if a clean table needs to persist.
 *
 * Usage:
 *   npx tsx scripts/real-jobs-backup.ts backup    # write the JSON backup only
 *   npx tsx scripts/real-jobs-backup.ts delete    # backup, then delete real rows
 *   npx tsx scripts/real-jobs-backup.ts restore   # re-create from the backup
 *   npx tsx scripts/real-jobs-backup.ts status    # what is in the table now
 *
 * Fake rows (zohoId starting FAKE-) are never touched by any of these.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { authPrisma, withRetry } from '../src/lib/auth-prisma'

const FAKE_PREFIX = 'FAKE-'
const BACKUP_FILE = join(process.cwd(), 'scripts', '.real-jobs-backup.json')

/** Everything that is not a fake row. */
const REAL = { NOT: { zohoId: { startsWith: FAKE_PREFIX } } } as const

async function backup(quiet = false) {
  const jobs = await authPrisma.job.findMany({ where: REAL })

  // Back up the applications too, not just the jobs.
  //
  // JobApplication has a foreign key to Job, so deleting a job REQUIRES deleting
  // its applications first. Those are real workers' applications — a record that
  // a person applied for a job — and they are not recoverable from Zoho the way
  // the job rows are. An earlier version of this script deleted them while
  // backing up only the jobs, which would have made the delete irreversible for
  // the half that matters most.
  const applications = await authPrisma.jobApplication.findMany({ where: { job: REAL } })

  writeFileSync(BACKUP_FILE, JSON.stringify({ jobs, applications }, null, 2), 'utf8')

  if (!quiet) {
    console.log(`Backed up to ${BACKUP_FILE}`)
    console.log(`  ${jobs.length} real job(s)`)
    console.log(`  ${applications.length} job application(s)\n`)
    jobs.slice(0, 10).forEach((j) => console.log(`  ${j.zohoId}  ${j.recruitmentTitle}`))
    if (jobs.length > 10) console.log(`  … and ${jobs.length - 10} more`)
  }
  return { jobs: jobs.length, applications: applications.length }
}

async function remove() {
  const n = await backup(true)
  console.log(`Backed up to scripts/.real-jobs-backup.json`)
  console.log(`  ${n.jobs} job(s), ${n.applications} application(s)`)

  const doomed = await authPrisma.job.findMany({
    where: REAL,
    select: { zohoId: true, recruitmentTitle: true },
  })

  if (doomed.length === 0) {
    console.log('No real jobs to delete.')
    return
  }

  console.log(`\nDeleting ${doomed.length} real job(s):`)
  doomed.forEach((j) => console.log(`  ${j.zohoId}  ${j.recruitmentTitle}`))

  // JobApplication has a foreign key to Job. Delete dependent rows first, or the
  // delete fails on a constraint — and any application pointing at a job being
  // removed is meaningless anyway.
  const apps = await authPrisma.jobApplication.deleteMany({
    where: { job: REAL },
  })
  if (apps.count > 0) console.log(`\n  also removed ${apps.count} dependent job application(s)`)

  const { count } = await authPrisma.job.deleteMany({ where: REAL })
  console.log(`\n${count} deleted.`)

  console.log('\n⚠️  The hourly Zoho sync will re-create these. Run this again, or')
  console.log('   pause the cron in apps/app/vercel.json, to keep the table clean.')
}

async function restore() {
  if (!existsSync(BACKUP_FILE)) {
    console.error('No backup found at scripts/.real-jobs-backup.json')
    process.exit(1)
  }

  const data = JSON.parse(readFileSync(BACKUP_FILE, 'utf8')) as {
    jobs: Array<Record<string, unknown>>
    applications: Array<Record<string, unknown>>
  }

  console.log(`Restoring ${data.jobs.length} job(s) and ${data.applications.length} application(s)…\n`)

  // Jobs first — applications carry a foreign key to them.
  for (const job of data.jobs) {
    const { id, ...rest } = job
    await authPrisma.job.upsert({
      where: { zohoId: rest.zohoId as string },
      create: { id: id as string, ...rest } as never,
      update: rest as never,
    })
  }
  console.log(`  ${data.jobs.length} job(s) restored`)

  for (const app of data.applications) {
    const { id, ...rest } = app
    await authPrisma.jobApplication.upsert({
      where: { id: id as string },
      create: { id: id as string, ...rest } as never,
      update: rest as never,
    })
  }
  console.log(`  ${data.applications.length} application(s) restored`)
}

async function status() {
  const fake = await authPrisma.job.count({ where: { zohoId: { startsWith: FAKE_PREFIX } } })
  const real = await authPrisma.job.count({ where: REAL })
  const active = await authPrisma.job.count({ where: { active: true } })
  console.log(`  fake rows   : ${fake}`)
  console.log(`  real rows   : ${real}`)
  console.log(`  active total: ${active}   <- what the dashboard query returns`)
  console.log(`  backup file : ${existsSync(BACKUP_FILE) ? 'present' : 'none'}`)
}

async function main() {
  const cmd = process.argv[2]
  if (!['backup', 'delete', 'restore', 'status'].includes(cmd ?? '')) {
    console.error('Usage: npx tsx scripts/real-jobs-backup.ts <backup|delete|restore|status>')
    process.exit(1)
  }

  const host = (process.env.AUTH_DATABASE_URL ?? '').match(/@([^/?]+)/)?.[1] ?? 'unknown'
  console.log(`database: ${host}\n`)

  if (cmd === 'backup') await withRetry(() => backup())
  else if (cmd === 'delete') await withRetry(remove)
  else if (cmd === 'restore') await withRetry(restore)
  else await withRetry(status)
}

main()
  .catch((e) => {
    console.error('\nFailed:', e)
    process.exit(1)
  })
  .finally(() => authPrisma.$disconnect())
