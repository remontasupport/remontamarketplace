// pnpm --filter @remonta/db localities:refresh [--apply --expect=<hash>] [--by=<name>]
//
// Loads data/au_localities.csv into au_localities. Needs DIRECT_DATABASE_URL (or
// AUTH_DATABASE_URL) in the environment.
//   1. Run without --apply: prints the plan -- added, changed, restored, retired, and
//      how many workers are placed at each retired locality -- plus its hash.
//      Nothing is written.
//   2. Review it, then run again with --apply --expect=<that hash>. The plan is
//      recomputed under a lock and applied only if it is still the same one.
// Re-running with the same CSV plans nothing.
import { readFile } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { DATA_DIR, sha256, type LocalitiesMeta } from './build.js'
import { fromCsv, type LocalityRow } from './csv.js'
import { runRefresh, type RefreshResult } from './refresh-db.js'

export async function readDataset(dir = DATA_DIR): Promise<{ rows: LocalityRow[]; meta: LocalitiesMeta }> {
  const csv = await readFile(join(dir, 'au_localities.csv'), 'utf8')
  const meta = JSON.parse(await readFile(join(dir, 'au_localities.meta.json'), 'utf8')) as LocalitiesMeta
  // Git on Windows may check the CSV out with CRLF; the checksum is over LF text.
  const hash = sha256(csv.replace(/\r\n/g, '\n'))
  if (hash !== meta.csvSha256) throw new Error('au_localities.csv does not match au_localities.meta.json -- rebuild, do not hand-edit')
  const rows = fromCsv(csv)
  if (rows.length !== meta.rows) throw new Error(`CSV has ${rows.length} rows, meta says ${meta.rows}`)
  return { rows, meta }
}

export function formatReport(r: RefreshResult, sourceVersion: string, limit = 25): string {
  const p = r.plan
  const key = (x: LocalityRow) => `${x.suburb} ${x.state} ${x.postcode}`
  const list = <T>(items: T[], f: (t: T) => string) =>
    [...items.slice(0, limit).map((i) => `    ${f(i)}`), ...(items.length > limit ? [`    ... ${items.length - limit} more`] : [])]
  return [
    `${sourceVersion} -- plan ${r.hash}`,
    `  added     ${p.inserts.length}`,
    ...list(p.inserts, key),
    `  changed   ${p.updates.length}`,
    ...list(p.updates, (u) => `${key(u.before)} -> ${key(u.after)}${moved(u.before, u.after)}`),
    `  restored  ${p.restores.length}`,
    ...list(p.restores, (s) => key(s.after)),
    `  retired   ${p.retires.length}`,
    ...list(p.retires, (t) => `${key(t.row)}  workers placed here: ${r.workersAtRetired.get(t.id) ?? 0}${t.successorKey ? `  successor ${t.successorKey}` : ''}`),
    `  unchanged ${p.unchanged}  (already retired: ${p.alreadyRetired})`,
  ].join('\n')
}

function moved(a: LocalityRow, b: LocalityRow): string {
  if (a.latitude === b.latitude && a.longitude === b.longitude) return ''
  // Equirectangular approximation; fine for a report at suburb scale.
  const toRad = Math.PI / 180
  const x = (b.longitude - a.longitude) * toRad * Math.cos(((a.latitude + b.latitude) / 2) * toRad)
  const y = (b.latitude - a.latitude) * toRad
  return `  (centroid moved ${(Math.sqrt(x * x + y * y) * 6371).toFixed(1)} km)`
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit?.slice(name.length + 3)
}

async function main() {
  const url = process.env.DIRECT_DATABASE_URL || process.env.AUTH_DATABASE_URL
  if (!url) throw new Error('set DIRECT_DATABASE_URL (or AUTH_DATABASE_URL)')
  const apply = process.argv.includes('--apply')
  const { rows, meta } = await readDataset()
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const host = new URL(url).host
    const result = await runRefresh(client, {
      rows,
      sourceVersion: meta.sourceVersion,
      apply,
      expect: arg('expect'),
      appliedBy: arg('by') ?? userInfo().username,
    })
    console.log(`database: ${host}`)
    console.log(formatReport(result, meta.sourceVersion))
    if (result.applied) console.log(`\napplied plan ${result.hash}`)
    else if (apply) console.log('\nnothing to apply')
    else console.log(`\ndry run -- nothing written. To apply exactly this plan:\n  localities:refresh --apply --expect=${result.hash}`)
  } finally {
    await client.end()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
}
