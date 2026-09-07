/**
 * Apply pending migrations to the REHEARSAL BRANCH — and only ever a branch.
 *
 * Prisma reads its connection from the datasource block, so migrating a branch
 * would otherwise mean temporarily editing DIRECT_DATABASE_URL. That is exactly
 * the manoeuvre that ends up pointed at production: the edit is easy to make,
 * easy to forget, and leaves no trace.
 *
 * This runs prisma with the connection overridden for the lifetime of one child
 * process. Nothing on disk changes, no shell variable is left set, and the run
 * REFUSES to start if REHEARSAL_DATABASE_URL resolves to a known production
 * endpoint. Production migrations go through `npm run db:migrate:deploy`, which
 * is a deliberate, separate act.
 *
 * Usage:
 *   node scripts/rehearsal/migrate-branch.js            show status on the branch
 *   node scripts/rehearsal/migrate-branch.js --deploy   apply pending migrations
 */

const path = require('path')
const { spawnSync } = require('child_process')
const { describe, loadEnv } = require('./endpoints')

const ROOT = path.resolve(__dirname, '..', '..')
const SCHEMA = 'prisma/auth-schema.prisma'

/**
 * Neon suspends an idle compute, and Prisma reports the resulting cold start as
 * `P1001: Can't reach database server` — indistinguishable, at a glance, from a
 * wrong hostname or a deleted branch. A branch left idle while you read output
 * hits this routinely, so wake it first and say so.
 */
async function waitForCompute(url, attempts = 5) {
  const { Client } = require('pg')
  for (let i = 1; i <= attempts; i++) {
    const c = new Client({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })
    try {
      await c.connect()
      await c.query('SELECT 1')
      await c.end()
      if (i > 1) console.log(`  compute awake (attempt ${i})`)
      return true
    } catch (err) {
      try { await c.end() } catch { /* already failed */ }
      if (i === 1) console.log('  compute is suspended — waking it...')
      if (i === attempts) {
        console.error(`  cannot reach the endpoint after ${attempts} attempts.`)
        console.error(`  ${err.message}`)
        console.error('  Check the branch still exists and has a compute in the Neon console.')
        return false
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  return false
}

async function main() {
  loadEnv(ROOT)
  const url = process.env.REHEARSAL_DATABASE_URL
  if (!url) {
    console.error('ERROR: REHEARSAL_DATABASE_URL is not set in .env.local.')
    console.error('See aidlc-docs/construction/runbooks/neon-rehearsal.md')
    return 1
  }

  const d = describe(url)
  if (!d) {
    console.error('ERROR: REHEARSAL_DATABASE_URL could not be parsed.')
    return 1
  }

  console.log('')
  console.log(`  endpoint ${d.endpoint}${d.pooled ? '  (pooled)' : '  (direct)'}`)
  console.log(`  database ${d.database}`)
  console.log('')

  if (d.production) {
    console.error('  REFUSING TO RUN.')
    console.error(`  That endpoint is ${d.label}.`)
    console.error('')
    console.error('  This command only ever targets a rehearsal branch. If you')
    console.error('  genuinely intend to migrate production, use:')
    console.error('      npm run db:migrate:deploy')
    console.error('')
    return 2
  }

  if (d.pooled) {
    console.error('  REFUSING TO RUN — this is a pooled connection.')
    console.error('  Migrations cannot run over PgBouncer.')
    console.error('')
    console.error('  Fix: in .env.local, remove "-pooler" from the hostname.')
    console.error(`      ${d.endpoint}-pooler...  ->  ${d.endpoint}...`)
    console.error('  (Or copy the direct string from the Neon connect dialog.)')
    console.error('')
    return 2
  }

  if (!(await waitForCompute(url))) return 1

  const deploy = process.argv.includes('--deploy')
  const args = deploy
    ? ['prisma', 'migrate', 'deploy', `--schema=${SCHEMA}`]
    : ['prisma', 'migrate', 'status', `--schema=${SCHEMA}`]

  console.log(`  running: prisma migrate ${deploy ? 'deploy' : 'status'} against the branch`)
  console.log('')

  // Override for this child process only. Both are set because prisma reads
  // `url` for some commands and `directUrl` for others.
  const res = spawnSync('npx', args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, AUTH_DATABASE_URL: url, DIRECT_DATABASE_URL: url },
  })

  if (res.status !== 0) return res.status || 1

  if (!deploy) {
    console.log('')
    console.log('  Status only. Add --deploy to apply pending migrations.')
  } else {
    console.log('')
    console.log('  Branch migrated. The schema moved; the DATA did not — repopulate')
    console.log('  the derived tables before testing anything that reads them:')
    console.log('')
    console.log('    npm run w1:reconcile -- --url-var REHEARSAL_DATABASE_URL --confirm')
    console.log('    npm run db:parity    -- --url-var REHEARSAL_DATABASE_URL --label after-migrate')
  }
  return 0
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(err.message)
  process.exit(1)
})
