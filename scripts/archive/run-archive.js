/**
 * AD-17 archive runner — the first script in this programme that WRITES.
 *
 * Preserves the six worker-authored columns before any slice drops them.
 * Everything it does is additive: it creates a schema and a table outside
 * `public` and copies values in. It never modifies or deletes source data.
 *
 * Guards, because this touches production:
 *   - refuses to run without --confirm; the default is a plan, not an action
 *   - the whole run is one transaction, so a failure leaves nothing behind
 *   - verification runs inside that transaction and ROLLS BACK on a mismatch
 *   - re-runnable: rows refresh rather than duplicate
 *
 * Usage:
 *   node scripts/archive/run-archive.js              show the plan, change nothing
 *   node scripts/archive/run-archive.js --confirm    execute
 *
 * Exit codes: 0 done or planned · 1 failure · 2 verification mismatch, rolled back
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.resolve(__dirname, '..', '..')
const SQL_FILE = path.join(__dirname, 'ad17-archive.sql')

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}

// Env precedence: already-set wins, then .env.local, then .env. An explicitly
// set variable must beat the dotfiles — this script writes to production, and a
// deliberate override being silently ignored is the worst possible surprise.
function loadEnv() {
  const preset = new Set(Object.keys(process.env))
  const fromFile = new Set()
  for (const file of ['.env', '.env.local']) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) continue
    for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (preset.has(key) && !fromFile.has(key)) continue
      process.env[key] = val
      fromFile.add(key)
    }
  }
}

function parseStatements(sql) {
  const out = []
  let label = 'unlabelled'
  let buf = []
  for (const line of sql.split(/\r?\n/)) {
    const header = line.match(/^--\s+(\d+[a-z]?\.\s+.*)$/)
    if (header) label = header[1].trim()
    if (/^\s*--/.test(line) || !line.trim()) {
      if (!buf.length) continue
    }
    buf.push(line)
    if (/;\s*$/.test(line)) {
      const stmt = buf.join('\n').replace(/^\s*(--.*\n)+/, '').trim()
      if (stmt && stmt !== ';') out.push({ label, sql: stmt })
      buf = []
    }
  }
  return out
}

// Each archived column must match its source count exactly. A shortfall means
// rows were silently missed, which is the one failure this script exists to
// prevent — so it rolls back rather than reporting a partial archive.
const PAIRS = [
  ['wp_unique_service', 'a_wp_unique_service', 's_wp_unique_service'],
  ['wp_fun_fact', 'a_wp_fun_fact', 's_wp_fun_fact'],
  ['wp_hobbies', 'a_wp_hobbies', 's_wp_hobbies'],
  ['wp_qualifications', 'a_wp_qualifications', 's_wp_qualifications'],
  ['wai_fun_fact', 'a_wai_fun_fact', 's_wai_fun_fact'],
  ['wai_unique_service', 'a_wai_unique_service', 's_wai_unique_service'],
]

async function main() {
  loadEnv()
  const confirmed = process.argv.includes('--confirm')
  const urlVar = argOf('--url-var', 'DIRECT_DATABASE_URL')
  const statements = parseStatements(fs.readFileSync(SQL_FILE, 'utf8'))

  if (!confirmed) {
    console.log('PLAN ONLY — nothing will be written. Add --confirm to execute.\n')
    console.log(`Target: ${urlVar}`)
    console.log(`Statements: ${statements.length}\n`)
    for (const s of statements) console.log('  - ' + s.label)
    console.log('\nAll additive: creates the `archive` schema and `archive.worker_ad17`,')
    console.log('copies the six AD-17 columns in, verifies the counts match the source.')
    console.log('No source row is modified or deleted.')
    return 0
  }

  const url = process.env[urlVar]
  if (!url) {
    console.error(`ERROR: ${urlVar} is not set in .env or .env.local`)
    return 1
  }

  const client = new Client({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
    statement_timeout: 300000,
  })

  await client.connect()
  await client.query('BEGIN')

  let verification = null
  try {
    for (const { label, sql } of statements) {
      const res = await client.query(sql)
      const rows = Array.isArray(res) ? res[res.length - 1].rows : res.rows
      if (rows && rows.length && label.startsWith('4.')) verification = rows[0]
      console.log(`ok   ${label}${res.rowCount != null ? ` (${res.rowCount} rows)` : ''}`)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    await client.end()
    console.error(`\nFAILED: ${err.message}`)
    console.error('Transaction rolled back — nothing was written.')
    return 1
  }

  if (!verification) {
    await client.query('ROLLBACK')
    await client.end()
    console.error('\nVerification query returned nothing. Rolled back.')
    return 2
  }

  console.log('\nVerification — archived vs source:\n')
  let bad = 0
  for (const [name, aKey, sKey] of PAIRS) {
    const a = Number(verification[aKey])
    const s = Number(verification[sKey])
    const ok = a === s
    if (!ok) bad++
    console.log(`  ${ok ? 'ok  ' : 'MISS'} ${name.padEnd(20)} archived ${String(a).padStart(5)}  source ${String(s).padStart(5)}`)
  }
  console.log(`\n  workers archived: ${verification.archived_workers}`)

  if (bad) {
    await client.query('ROLLBACK')
    await client.end()
    console.error(`\n${bad} column(s) did not match. ROLLED BACK — nothing was written.`)
    return 2
  }

  await client.query('COMMIT')
  await client.end()
  console.log('\nCommitted. archive.worker_ad17 holds every AD-17 value.')
  console.log('Re-run db:migrate:diff to confirm Prisma still reports no drift.')
  return 0
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(err.message)
  process.exit(1)
})
