/**
 * Seed fake jobs into the Job table — AND REMOVE THEM AGAIN.
 *
 * ⚠️  THIS WRITES TO THE LIVE APPLICATION DATABASE (AUTH_DATABASE_URL).
 *
 * There is no separate development database in this repository. The rows this
 * script creates are visible to every signed-in worker on their dashboard, on
 * the real site, immediately after the cache is invalidated.
 *
 * Three things make that recoverable:
 *
 *   1. Every row uses a zohoId prefixed FAKE- , which no Zoho lead can produce.
 *      That prefix is the only handle the cleanup relies on, so it is never
 *      constructed dynamically or made configurable.
 *   2. Every title is prefixed [TEST] , so a real worker who sees one before
 *      cleanup can tell what it is rather than applying for a job that does not
 *      exist.
 *   3. `remove` deletes exactly and only rows whose zohoId starts with FAKE- .
 *
 * The sync at /api/cron/sync-jobs upserts by zohoId and does NOT deactivate
 * rows it did not create — verified, no deleteMany and no bulk active:false. So
 * these rows persist until this script removes them. They will not disappear on
 * their own.
 *
 * Usage:
 *   npx tsx scripts/seed-fake-jobs.ts add       # insert (or refresh) the fake jobs
 *   npx tsx scripts/seed-fake-jobs.ts remove    # delete every FAKE- row
 *   npx tsx scripts/seed-fake-jobs.ts list      # show what is currently there
 *
 * Both add and remove invalidate the Redis cache. Without that the dashboard
 * keeps serving the previous list for up to CACHE_TTL.ACTIVE_JOBS (2 hours),
 * which otherwise looks exactly like the script having failed.
 */

import { authPrisma, withRetry } from '../src/lib/auth-prisma'
import { invalidateCache, CACHE_KEYS } from '../src/lib/redis'

/** The one handle cleanup depends on. Never change this without changing remove(). */
const FAKE_PREFIX = 'FAKE-'
const TITLE_PREFIX = '[TEST] '

const FAKE_JOBS = [
  {
    zohoId: `${FAKE_PREFIX}0001`,
    status: 'Recruitment End',
    recruitmentTitle: `${TITLE_PREFIX}Support Worker — Morning Personal Care`,
    service: 'Assistance with daily personal activities',
    jobDescription:
      'Seed data for dashboard testing. Two morning shifts per week supporting a participant with personal care and breakfast routine. Not a real vacancy.',
    city: 'Brisbane',
    state: 'QLD',
  },
  {
    zohoId: `${FAKE_PREFIX}0002`,
    status: 'Recruitment End',
    recruitmentTitle: `${TITLE_PREFIX}Community Access — Weekend Social Support`,
    service: 'Assistance with social and community participation',
    jobDescription:
      'Seed data for dashboard testing. Saturday community access supporting a participant to attend a local art group. Not a real vacancy.',
    city: 'Gold Coast',
    state: 'QLD',
  },
  {
    zohoId: `${FAKE_PREFIX}0003`,
    status: 'Recruitment End',
    recruitmentTitle: `${TITLE_PREFIX}Domestic Assistance — Weekly`,
    service: 'Assistance with household tasks',
    jobDescription:
      'Seed data for dashboard testing. Weekly household support including cleaning and meal preparation. Not a real vacancy.',
    city: 'Sydney',
    state: 'NSW',
  },
  {
    zohoId: `${FAKE_PREFIX}0004`,
    status: 'Recruitment End',
    recruitmentTitle: `${TITLE_PREFIX}Transport Support — Medical Appointments`,
    service: 'Transport',
    jobDescription:
      'Seed data for dashboard testing. Fortnightly transport to medical appointments. Driver licence and comprehensive insurance required. Not a real vacancy.',
    city: 'Melbourne',
    state: 'VIC',
  },
  {
    zohoId: `${FAKE_PREFIX}0005`,
    status: 'Recruitment End',
    recruitmentTitle: `${TITLE_PREFIX}Overnight Active Support`,
    service: 'Assistance with daily personal activities',
    jobDescription:
      'Seed data for dashboard testing. Two overnight active shifts per fortnight. Not a real vacancy.',
    city: 'Perth',
    state: 'WA',
  },
]

async function refreshCache() {
  await invalidateCache(CACHE_KEYS.activeJobs())
  console.log('  cache key invalidated:', CACHE_KEYS.activeJobs())
}

async function add() {
  console.log(`Seeding ${FAKE_JOBS.length} fake jobs into the LIVE database…\n`)

  let created = 0
  let updated = 0

  for (const job of FAKE_JOBS) {
    // Upsert, so running this twice refreshes rather than duplicating or
    // colliding on the unique zohoId.
    const existing = await authPrisma.job.findUnique({
      where: { zohoId: job.zohoId },
      select: { id: true },
    })

    await authPrisma.job.upsert({
      where: { zohoId: job.zohoId },
      create: { ...job, active: true, postedAt: new Date(), lastSyncedAt: new Date() },
      update: { ...job, active: true, lastSyncedAt: new Date() },
    })

    existing ? updated++ : created++
    console.log(`  ${existing ? 'updated' : 'created'}  ${job.zohoId}  ${job.recruitmentTitle}`)
  }

  console.log(`\n${created} created, ${updated} updated.`)
  await refreshCache()
  console.log('\nThese are LIVE and visible to every worker. Remove them with:')
  console.log('  npx tsx scripts/seed-fake-jobs.ts remove')
}

async function remove() {
  const doomed = await authPrisma.job.findMany({
    where: { zohoId: { startsWith: FAKE_PREFIX } },
    select: { zohoId: true, recruitmentTitle: true },
  })

  if (doomed.length === 0) {
    console.log('No fake jobs found. Nothing to remove.')
    return
  }

  console.log(`Removing ${doomed.length} fake job(s):\n`)
  doomed.forEach((j) => console.log(`  ${j.zohoId}  ${j.recruitmentTitle}`))

  const { count } = await authPrisma.job.deleteMany({
    where: { zohoId: { startsWith: FAKE_PREFIX } },
  })

  console.log(`\n${count} deleted.`)
  await refreshCache()
}

async function list() {
  const fake = await authPrisma.job.findMany({
    where: { zohoId: { startsWith: FAKE_PREFIX } },
    select: { zohoId: true, recruitmentTitle: true, active: true, city: true, state: true },
    orderBy: { zohoId: 'asc' },
  })

  const realActive = await authPrisma.job.count({
    where: { active: true, NOT: { zohoId: { startsWith: FAKE_PREFIX } } },
  })

  console.log(`Fake jobs in the database: ${fake.length}`)
  fake.forEach((j) =>
    console.log(`  ${j.zohoId}  ${j.active ? 'active  ' : 'inactive'}  ${j.city}, ${j.state}  ${j.recruitmentTitle}`)
  )
  console.log(`\nReal active jobs, untouched: ${realActive}`)
}

async function main() {
  const command = process.argv[2]

  if (!['add', 'remove', 'list'].includes(command ?? '')) {
    console.error('Usage: npx tsx scripts/seed-fake-jobs.ts <add|remove|list>')
    process.exit(1)
  }

  // Say which database is about to be touched. The host is enough to tell the
  // live database from the rehearsal one without printing credentials.
  const url = process.env.AUTH_DATABASE_URL ?? ''
  const host = url.match(/@([^/?]+)/)?.[1] ?? 'unknown'
  console.log(`database: ${host}\n`)

  // Neon suspends after inactivity, and the first query against a sleeping
  // database fails with "Can't reach database server". withRetry backs off
  // 1s -> 2s -> 4s; src/lib/auth-prisma.ts exports it for exactly this. A seed
  // script run once in a while is precisely the access pattern that hits a cold
  // database -- confirmed while writing this, when a plain count() hung.
  if (command === 'add') await withRetry(add)
  else if (command === 'remove') await withRetry(remove)
  else await withRetry(list)
}

main()
  .catch((e) => {
    console.error('\nFailed:', e)
    process.exit(1)
  })
  .finally(() => authPrisma.$disconnect())
