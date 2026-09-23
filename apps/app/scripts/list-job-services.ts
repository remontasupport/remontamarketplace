/**
 * List the distinct `service` values on active jobs.
 *
 * The dashboard's service dropdown filters with
 *   job.service.toLowerCase().includes(selectedService.toLowerCase())
 * against a hardcoded SERVICE_OPTIONS list. If the stored values do not contain
 * those words as substrings, choosing an option returns nothing. This shows what
 * is actually stored so the two can be compared.
 *
 * Usage: npx tsx scripts/list-job-services.ts
 */
import { authPrisma, withRetry } from '../src/lib/auth-prisma'

const SERVICE_OPTIONS = [
  'Support Work', 'Cleaning', 'Gardening', 'Physiotherapy', 'Occupational Therapy',
  'Exercise Physiology', 'Psychology', 'Behavioural Support', 'Social Work',
  'Speech Pathology', 'Personal Training', 'Nursing (RN/EN)', 'Home Modifications',
]

async function run() {
  const rows = await authPrisma.job.findMany({
    where: { active: true },
    select: { zohoId: true, service: true },
  })

  const counts = new Map<string, { seed: number; real: number }>()
  for (const r of rows) {
    const key = r.service ?? '(null)'
    const kind = r.zohoId.startsWith('FAKE-') ? 'seed' : 'real'
    const e = counts.get(key) ?? { seed: 0, real: 0 }
    e[kind]++
    counts.set(key, e)
  }

  console.log(`active jobs: ${rows.length}\n`)
  console.log('stored service values:')
  for (const [value, n] of [...counts.entries()].sort()) {
    console.log(`  seed=${n.seed} real=${n.real}  ${JSON.stringify(value)}`)
  }

  console.log('\ndropdown option -> how many active jobs it would match:')
  for (const opt of SERVICE_OPTIONS) {
    const n = rows.filter((r) => (r.service ?? '').toLowerCase().includes(opt.toLowerCase())).length
    console.log(`  ${n === 0 ? 'MATCHES NOTHING' : String(n).padStart(15)}  ${opt}`)
  }
}

withRetry(run)
  .catch((e) => { console.error('Failed:', e); process.exit(1) })
  .finally(() => authPrisma.$disconnect())
