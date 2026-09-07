/**
 * Which database am I about to touch?
 *
 * Every slice runs first on a Neon branch and only later on production. The
 * connection strings differ by a few characters, the branch names are
 * misleading, and both databases are called `workerprofiles` — so this prints
 * the target in a form a human can check at a glance.
 *
 * Never prints credentials.
 *
 *   node scripts/rehearsal/whereami.js                          all configured targets
 *   node scripts/rehearsal/whereami.js REHEARSAL_DATABASE_URL   just one
 */

const path = require('path')
const { describe, loadEnv } = require('./endpoints')

const ROOT = path.resolve(__dirname, '..', '..')

const KNOWN_VARS = [
  'AUTH_DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'DATABASE_URL',
  'REHEARSAL_DATABASE_URL',
]

function main() {
  loadEnv(ROOT)
  const only = process.argv[2]
  const vars = only ? [only] : KNOWN_VARS

  console.log('')
  let anyProd = false

  for (const v of vars) {
    const url = process.env[v]
    if (!url) {
      console.log(`  ${v.padEnd(24)} not set`)
      console.log('')
      continue
    }
    const d = describe(url)
    if (!d) {
      console.log(`  ${v.padEnd(24)} UNPARSEABLE`)
      console.log('')
      continue
    }
    if (d.production) anyProd = true
    console.log(`  ${v.padEnd(24)} ${d.production ? 'PRODUCTION' : 'branch/copy'}`)
    console.log(`  ${''.padEnd(24)} ${d.label}`)
    console.log(`  ${''.padEnd(24)} endpoint ${d.endpoint}${d.pooled ? '  (pooled)' : '  (direct)'}`)
    console.log(`  ${''.padEnd(24)} database ${d.database}`)
    console.log('')
  }

  if (!process.env.REHEARSAL_DATABASE_URL) {
    console.log('  No rehearsal branch configured. To create one, see')
    console.log('  aidlc-docs/construction/runbooks/neon-rehearsal.md')
    console.log('')
  }

  if (anyProd) {
    console.log('  Reminder: the Neon branch named "production" holds the LEGACY')
    console.log('  contractor directory. Application data lives in the branch named')
    console.log('  "authentication". Check the endpoint, never the name.')
    console.log('')
  }
}

main()
