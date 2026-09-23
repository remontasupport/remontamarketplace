/**
 * Rename seeded job ids so they do not read as "fake" in URLs.
 *
 * The dashboard puts the job's PRIMARY KEY in the query string:
 *
 *   /dashboard/worker?apply=fake-job-0024
 *
 * Ids set by hand in the Neon console ended up as fake-job-00NN, which is
 * visible to anyone who opens the apply flow. This replaces them with ids in
 * the same shape Prisma generates, so they are indistinguishable from real rows.
 *
 * SAFE TO RUN. job_applications_jobId_fkey is declared ON UPDATE CASCADE, so
 * updating jobs.id rewrites any referencing jobId automatically — no orphans,
 * no manual second step. Verified in
 * packages/db/prisma/migrations/0_init/migration.sql:687.
 *
 * zohoId is NOT touched, and that is deliberate. It stays FAKE-00NN because it
 * is what every other piece of tooling keys on: the seed script's list and
 * remove, and the production exclusion in NewsSliderAsync that keeps these rows
 * off the live dashboard. Renaming it would quietly turn seeded rows into
 * rows indistinguishable from real ones — the opposite of what is wanted.
 *
 * Usage:
 *   npx tsx scripts/rename-fake-job-ids.ts preview   # show what would change
 *   npx tsx scripts/rename-fake-job-ids.ts apply     # do it
 */

import { randomBytes } from 'node:crypto'
import { authPrisma, withRetry } from '../src/lib/auth-prisma'

/** Prisma's cuid() shape: 'c' followed by 24 lowercase alphanumerics. */
function cuidLike(): string {
  return 'c' + randomBytes(16).toString('hex').slice(0, 24)
}

/** Any id that advertises itself as seed data. */
const LOOKS_FAKE = { OR: [{ id: { startsWith: 'fake' } }, { id: { startsWith: 'FAKE' } }] }

async function targets() {
  return authPrisma.job.findMany({
    where: LOOKS_FAKE,
    select: { id: true, zohoId: true, recruitmentTitle: true },
    orderBy: { zohoId: 'asc' },
  })
}

async function preview() {
  const jobs = await targets()
  if (jobs.length === 0) {
    console.log('No job ids look like seed data. Nothing to rename.')
    return
  }
  console.log(`${jobs.length} job id(s) would be renamed:\n`)
  jobs.forEach((j) => console.log(`  ${j.id.padEnd(20)} → <cuid>   (${j.zohoId})`))
  console.log('\nzohoId is left alone — the tooling and the production exclusion key on it.')
  console.log('Run with "apply" to perform the rename.')
}

async function apply() {
  const jobs = await targets()
  if (jobs.length === 0) {
    console.log('No job ids look like seed data. Nothing to rename.')
    return
  }

  console.log(`Renaming ${jobs.length} job id(s)…\n`)

  let renamed = 0
  for (const job of jobs) {
    const next = cuidLike()

    // ON UPDATE CASCADE carries job_applications.jobId across with it.
    await authPrisma.job.update({ where: { id: job.id }, data: { id: next } })

    renamed++
    console.log(`  ${job.id.padEnd(20)} → ${next}`)
  }

  // Verify something that can actually fail.
  //
  // An earlier version counted "orphaned applications" with { job: { is: null } }.
  // That is not valid Prisma — jobId is non-nullable, so the relation cannot be
  // null — and it was wrapped in .catch(() => 0), so the invalid query threw and
  // the script printed "orphaned applications: 0" as though it had verified
  // something. A check that cannot fail is worse than no check, because it reads
  // like assurance.
  //
  // Orphans are impossible here by construction: the FK is enforced and declared
  // ON UPDATE CASCADE. What is worth confirming is that no seed-looking id
  // survived the rename.
  const remaining = await authPrisma.job.count({ where: LOOKS_FAKE })

  console.log(`\n${renamed} renamed.`)
  console.log(`ids still looking like seed data: ${remaining}   (expected 0)`)
  console.log('\nThe apply URL now reads /dashboard/worker?apply=c… like any other job.')
}

async function main() {
  const cmd = process.argv[2]
  if (!['preview', 'apply'].includes(cmd ?? '')) {
    console.error('Usage: npx tsx scripts/rename-fake-job-ids.ts <preview|apply>')
    process.exit(1)
  }

  const host = (process.env.AUTH_DATABASE_URL ?? '').match(/@([^/?]+)/)?.[1] ?? 'unknown'
  console.log(`database: ${host}\n`)

  if (cmd === 'preview') await withRetry(preview)
  else await withRetry(apply)
}

main()
  .catch((e) => {
    console.error('\nFailed:', e)
    process.exit(1)
  })
  .finally(() => authPrisma.$disconnect())
