/**
 * Worker-slice parity checker.
 *
 * Captures a snapshot of the worker data, or compares two snapshots and fails
 * on any difference. This is the gate for phase P3 of every slice: no slice
 * proceeds on a red result.
 *
 * READ-ONLY: the connection runs inside a read-only transaction, so an
 * accidental write is rejected by the server rather than trusted to the file.
 *
 * Usage:
 *   node scripts/parity/run-parity.js                     capture a snapshot
 *   node scripts/parity/run-parity.js --label before-w1   name it
 *   node scripts/parity/run-parity.js --compare a.json b.json
 *   node scripts/parity/run-parity.js --dry-run              parse only, no connection
 *
 * Exit codes: 0 clean · 1 query failure · 2 parity difference found
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.resolve(__dirname, '..', '..')
const SQL_FILE = path.join(__dirname, 'worker-parity.sql')
const OUT_DIR = path.join(ROOT, 'aidlc-docs', 'construction', 'parity')

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}

// Tables the slices create. Counted only once they exist, so the same script
// works before the first slice and after the last.
const NEW_TABLES = [
  'worker_job_history',
  'worker_education',
  'worker_availability',
  'worker_experience',
  'worker_bank_accounts',
  'worker_photos',
  'worker_service_categories',
  'worker_service_subcategories',
  'worker_ad17_archive',
]

// --- env precedence: already-set wins, then .env.local, then .env ------------
// An explicitly set variable must beat the dotfiles. Overwriting process.env
// would mean a deliberate one-off override silently runs somewhere else.
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

// --- split the SQL file into labelled statements -----------------------------
function parseStatements(sql) {
  const out = []
  let label = 'unlabelled'
  let buf = []
  for (const line of sql.split(/\r?\n/)) {
    // Labels look like "5.", "5b.", "5c2." — the trailing digit matters, because
    // sections are keyed by label and a collision silently overwrites a result.
    const header = line.match(/^--\s+(\d+[a-z]?\d*\.\s+.*)$/)
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

function toMarkdownTable(rows) {
  if (!rows.length) return '_(no rows)_\n'
  const cols = Object.keys(rows[0])
  const esc = (v) =>
    v === null ? '`NULL`'
      : typeof v === 'object' ? '`' + JSON.stringify(v) + '`'
      : String(v).replace(/\|/g, '\\|')
  return [
    '| ' + cols.join(' | ') + ' |',
    '|' + cols.map(() => '---').join('|') + '|',
    ...rows.map((r) => '| ' + cols.map((c) => esc(r[c])).join(' | ') + ' |'),
  ].join('\n') + '\n'
}

// --- compare mode ------------------------------------------------------------
// Walks both snapshots and reports every value that moved. Deliberately dumb:
// it knows nothing about which changes are acceptable, so a human decides.
function compare(beforePath, afterPath) {
  const a = JSON.parse(fs.readFileSync(beforePath, 'utf8'))
  const b = JSON.parse(fs.readFileSync(afterPath, 'utf8'))
  const diffs = []

  const labels = new Set([...Object.keys(a.sections || {}), ...Object.keys(b.sections || {})])
  for (const label of labels) {
    const ra = (a.sections || {})[label]
    const rb = (b.sections || {})[label]
    if (!ra || !rb) { diffs.push({ label, field: '(section)', before: ra ? 'present' : 'missing', after: rb ? 'present' : 'missing' }); continue }
    const n = Math.max(ra.length, rb.length)
    for (let i = 0; i < n; i++) {
      const rowA = ra[i] || {}
      const rowB = rb[i] || {}
      for (const key of new Set([...Object.keys(rowA), ...Object.keys(rowB)])) {
        const va = rowA[key]
        const vb = rowB[key]
        if (String(va) !== String(vb)) {
          diffs.push({ label, field: (ra.length > 1 ? `[${i}] ` : '') + key, before: va, after: vb })
        }
      }
    }
  }

  console.log(`\nbefore : ${path.basename(beforePath)}  (${a.capturedAt})`)
  console.log(`after  : ${path.basename(afterPath)}  (${b.capturedAt})\n`)

  if (!diffs.length) {
    console.log('PARITY CLEAN — every value identical.')
    return 0
  }
  console.log(`PARITY DIFFERENCES — ${diffs.length}\n`)
  for (const d of diffs) {
    console.log(`  ${d.label}`)
    console.log(`    ${d.field}: ${d.before}  ->  ${d.after}`)
  }
  console.log('\nEvery difference must be explained before the slice proceeds.')
  return 2
}

// --- snapshot mode -----------------------------------------------------------
async function snapshot() {
  const urlVar = argOf('--url-var', 'AUTH_DATABASE_URL')
  const label = argOf('--label', 'snapshot')
  const url = process.env[urlVar]
  if (!url) {
    console.error(`ERROR: ${urlVar} is not set in .env or .env.local`)
    process.exit(1)
  }

  const client = new Client({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
    statement_timeout: 120000,
  })

  const statements = parseStatements(fs.readFileSync(SQL_FILE, 'utf8'))
  const capturedAt = new Date().toISOString()
  const sections = {}
  let failures = 0

  await client.connect()
  // Belt and braces: the server rejects any write regardless of the SQL.
  await client.query('BEGIN READ ONLY')

  for (const { label: stmtLabel, sql } of statements) {
    try {
      const res = await client.query(sql)
      const rows = Array.isArray(res) ? res[res.length - 1].rows : res.rows
      sections[stmtLabel] = rows
      console.log(`ok   ${stmtLabel} (${rows.length} rows)`)
    } catch (err) {
      failures++
      sections[stmtLabel] = [{ error: err.message }]
      console.error(`FAIL ${stmtLabel}: ${err.message}`)
    }
  }

  // Slice tables are counted only once they exist.
  const present = []
  for (const t of NEW_TABLES) {
    const { rows } = await client.query('SELECT to_regclass($1) AS reg', ['public.' + t])
    if (rows[0].reg) present.push(t)
  }
  const newCounts = []
  for (const t of present) {
    const { rows } = await client.query(`SELECT count(*)::int AS rows FROM ${t}`)
    newCounts.push({ table: t, rows: rows[0].rows })
  }
  sections['90. Slice tables present'] = newCounts.length
    ? newCounts
    : [{ table: '(none yet)', rows: 0 }]

  await client.query('COMMIT')
  await client.end()

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const stamp = capturedAt.replace(/[:.]/g, '-')
  const jsonPath = path.join(OUT_DIR, `${label}-${stamp}.json`)
  const mdPath = path.join(OUT_DIR, `${label}-${stamp}.md`)

  fs.writeFileSync(jsonPath, JSON.stringify({ label, capturedAt, urlVar, sections }, null, 2))

  const md = [
    `# Worker Parity Snapshot — ${label}`,
    '',
    `**Captured**: ${capturedAt}`,
    `**Source**: \`${urlVar}\``,
    '**Mode**: READ ONLY transaction — no writes were possible',
    '',
    'Counts, checksums and shape tallies only. No personal data.',
    '',
    '---',
    '',
    ...Object.entries(sections).flatMap(([k, rows]) => [`## ${k}`, '', toMarkdownTable(rows), '']),
  ].join('\n')
  fs.writeFileSync(mdPath, md)

  console.log(`\nsnapshot -> ${path.relative(ROOT, jsonPath)}`)
  console.log(`report   -> ${path.relative(ROOT, mdPath)}`)
  if (failures) {
    console.error(`\n${failures} statement(s) failed.`)
    return 1
  }
  console.log('\nAll checks captured.')
  return 0
}

async function main() {
  loadEnv()
  if (process.argv.includes('--dry-run')) {
    const stmts = parseStatements(fs.readFileSync(SQL_FILE, 'utf8'))
    console.log(`parsed ${stmts.length} statement(s) from worker-parity.sql:`)
    for (const s of stmts) console.log('  - ' + s.label)
    console.log(`\nslice tables watched: ${NEW_TABLES.length}`)
    process.exit(0)
  }
  const ci = process.argv.indexOf('--compare')
  if (ci !== -1) {
    const a = process.argv[ci + 1]
    const b = process.argv[ci + 2]
    if (!a || !b) {
      console.error('ERROR: --compare needs two snapshot paths')
      process.exit(1)
    }
    process.exit(compare(a, b))
  }
  process.exit(await snapshot())
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
