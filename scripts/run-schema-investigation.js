/**
 * Runs scripts/schema-investigation.sql and writes a markdown report.
 *
 * READ-ONLY: opens the connection in a read-only transaction, so any
 * accidental write is rejected by the server rather than trusted to the file.
 *
 * Usage:  node scripts/run-schema-investigation.js [--url-var AUTH_DATABASE_URL]
 * Output: aidlc-docs/inception/requirements/investigation-results.md
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.resolve(__dirname, '..')
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}
const SQL_NAME = argOf('--sql-file', 'schema-investigation.sql')
const SQL_FILE = path.join(ROOT, 'scripts', SQL_NAME)
const OUT_FILE = path.join(
  ROOT, 'aidlc-docs', 'inception', 'requirements',
  SQL_NAME.replace(/^schema-investigation/, 'investigation-results').replace(/.sql$/, '.md')
)

// --- load env from .env then .env.local (local wins), without extra deps ----
function loadEnv() {
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
      process.env[key] = val
    }
  }
}

// --- split the SQL file into labelled statements -----------------------------
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

async function main() {
  loadEnv()
  const urlVar = argOf('--url-var', 'AUTH_DATABASE_URL')
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
  const parts = [
    '# Schema Investigation — Results',
    '',
    `**Run**: ${new Date().toISOString()}`,
    `**Source**: \`scripts/schema-investigation.sql\` via \`${urlVar}\``,
    '**Mode**: READ ONLY transaction — no writes were possible',
    '',
    'Aggregate counts and key names only. No personal data is included.',
    '',
    '---',
    '',
  ]

  await client.connect()
  // Belt and braces: the server rejects any write regardless of the SQL.
  await client.query('BEGIN READ ONLY')

  let failures = 0
  for (const { label, sql } of statements) {
    parts.push(`## ${label}`, '')
    try {
      const res = await client.query(sql)
      const rows = Array.isArray(res) ? res[res.length - 1].rows : res.rows
      parts.push(toMarkdownTable(rows), '')
      console.log(`ok   ${label} (${rows.length} rows)`)
    } catch (err) {
      failures++
      parts.push('```', `ERROR: ${err.message}`, '```', '')
      console.error(`FAIL ${label}: ${err.message}`)
    }
  }

  await client.query('ROLLBACK')
  await client.end()

  if (failures) {
    parts.push('---', '', `**${failures} statement(s) failed** — see errors above.`, '')
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, parts.join('\n'), 'utf8')
  console.log(`\nReport written to ${path.relative(ROOT, OUT_FILE)}`)
}

main().catch((e) => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
