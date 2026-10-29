// search-locations U5 (FR-7r, FR-10): the api neither reads nor writes the legacy worker_profiles
// location columns. The HOME worker_locations row is the only record of where a worker is; the
// columns leave the schema in U6 and the database in U7.
//   1. Raw SQL (template literals): no `p.<column>` (p = worker_profiles in every statement here).
//   2. Prisma: no legacy key at the top level of a workerProfile operation's select / data / create /
//      update, whether called directly (`workerProfile.findMany(...)`) or nested (`workerProfile: { create: ... }`).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '../../src')
const LEGACY = ['location', 'city', 'state', 'postalCode', 'latitude', 'longitude']
const RAW = /\bp\.(?:location|city|state|latitude|longitude|"postalCode")(?!\w)/

/** The SQL a file holds: its template literals (Prisma.sql`...`, $queryRaw`...`), not its JavaScript. */
export const sqlOf = (src: string): string => [...src.matchAll(/`[^`]*`/g)].map((m) => m[0]).join('\n')

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e)
    return statSync(p).isDirectory() ? filesUnder(p) : /\.ts$/.test(e) ? [p] : []
  })
}

/** The text between the bracket at `open` and its match. */
function balanced(src: string, open: number): string {
  const [o, c] = src[open] === '(' ? ['(', ')'] : ['{', '}']
  let depth = 1
  let i = open + 1
  while (i < src.length && depth > 0) {
    if (src[i] === o) depth++
    else if (src[i] === c) depth--
    i++
  }
  return src.slice(open + 1, i - 1)
}

/** The keys of an object literal's body at its own level, each with its value's body when that value is an object. */
function entries(body: string): { key: string; object: string | null }[] {
  const out: { key: string; object: string | null }[] = []
  let depth = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!
    if (ch === '{' || ch === '(' || ch === '[') depth++
    else if (ch === '}' || ch === ')' || ch === ']') depth--
    else if (depth === 0) {
      const m = /^(\w+)\s*:\s*/.exec(body.slice(i))
      if (m && (i === 0 || /[\s,{]/.test(body[i - 1]!))) {
        const after = i + m[0].length
        out.push({ key: m[1]!, object: body[after] === '{' ? balanced(body, after) : null })
        i = after - 1
      }
    }
  }
  return out
}

/** Legacy keys at the top level of a workerProfile operation's select/data/create/update. */
export function legacyKeys(src: string): string[] {
  const ops: string[] = []
  for (const m of src.matchAll(/workerProfile\.\w+\(\s*\{/g)) ops.push(balanced(src, m.index! + m[0].length - 1))
  for (const m of src.matchAll(/\bworkerProfile:\s*\{/g)) ops.push(balanced(src, m.index! + m[0].length - 1))
  const found: string[] = []
  for (const op of ops) {
    for (const part of entries(op)) {
      if (!['select', 'data', 'create', 'update'].includes(part.key) || part.object === null) continue
      for (const e of entries(part.object)) if (LEGACY.includes(e.key)) found.push(e.key)
    }
  }
  return found
}

describe('the api does not touch the legacy location columns (FR-7r, FR-10)', () => {
  const files = filesUnder(SRC)

  it('the scan finds the workerProfile operations', () => {
    const withOps = files.filter((f) => /workerProfile[.:]/.test(readFileSync(f, 'utf8')))
    expect(withOps.length).toBeGreaterThan(10)
  })

  it.each(files.map((f) => [relative(SRC, f), f]))('%s', (_rel, f) => {
    const src = readFileSync(f, 'utf8')
    expect(sqlOf(src)).not.toMatch(RAW)
    expect(legacyKeys(src)).toEqual([])
  })

  it('the checks fail on a legacy read or write and ignore nested relation selects (a check that cannot fail proves nothing)', () => {
    expect(sqlOf('Prisma.sql`SELECT p.city FROM worker_profiles p`')).toMatch(RAW)
    expect(sqlOf('Prisma.sql`COALESCE(al.state, p."postalCode")`')).toMatch(RAW)
    expect(sqlOf('const x = { location: p.location }')).not.toMatch(RAW) // JavaScript, not SQL
    expect(legacyKeys("tx.workerProfile.findUnique({ where: { id }, select: { id: true, city: true } })")).toEqual(['city'])
    expect(legacyKeys("tx.workerProfile.update({ where: { id }, data: { location: 'x', updatedAt: now } })")).toEqual(['location'])
    expect(legacyKeys("db.user.create({ data: { workerProfile: { create: { firstName, latitude: 1 } } } })")).toEqual(['latitude'])
    expect(legacyKeys("db.workerProfile.findMany({ select: { id: true, locations: { select: { locality: { select: { state: true } } } } } })")).toEqual([])
  })
})
