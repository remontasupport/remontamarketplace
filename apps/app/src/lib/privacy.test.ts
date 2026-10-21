// P5 negative test (U2 H7): the home address never reaches a client-facing route or page.
// 1. No client-facing file names the private columns.
// 2. Every worker_profiles read there selects named columns: a read without `select` would
//    return every scalar column, the home street line included, without naming it.
// The admin route (/api/admin/contractors/[id]) is the one place that reads it, masked bank
// account alongside; it is not in these folders.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '..')
const CLIENT_FACING = ['app/api/client', 'app/api/public', 'app/api/contractors', 'app/api/share', 'app/api/coordinator', 'app/share', 'app/workers']

function filesUnder(dir: string): string[] {
  const abs = join(SRC, dir)
  let entries: string[]
  try {
    entries = readdirSync(abs)
  } catch {
    return []
  }
  return entries.flatMap((e) => {
    const p = join(abs, e)
    return statSync(p).isDirectory() ? filesUnder(relative(SRC, p)) : /\.(ts|tsx)$/.test(e) && !/\.test\./.test(e) ? [p] : []
  })
}

/** The argument text of each `workerProfile.find*(` call, by balanced parentheses. */
export function workerReads(src: string): string[] {
  const out: string[] = []
  const re = /workerProfile\.(findMany|findUnique|findUniqueOrThrow|findFirst|findFirstOrThrow)\(/g
  for (let m = re.exec(src); m; m = re.exec(src)) {
    let depth = 1
    let i = m.index + m[0].length
    while (i < src.length && depth > 0) {
      if (src[i] === '(') depth++
      else if (src[i] === ')') depth--
      i++
    }
    out.push(src.slice(m.index + m[0].length, i - 1))
  }
  return out
}

const files = CLIENT_FACING.flatMap(filesUnder)

describe('the home address stays private (P5)', () => {
  it('the scan finds the client-facing files', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  it.each(files.map((f) => [relative(SRC, f), f]))('%s names no private column and selects named columns', (_rel, f) => {
    const src = readFileSync(f, 'utf8')
    expect(src).not.toMatch(/homeStreetLine|homeLocality/)
    for (const args of workerReads(src)) expect(args, 'a worker_profiles read without select').toMatch(/\bselect\b/)
  })

  it('the read check fails on a read without select (a check that cannot fail proves nothing)', () => {
    expect(workerReads('prisma.workerProfile.findMany({ where: { id } })')[0]).not.toMatch(/\bselect\b/)
    expect(workerReads('prisma.workerProfile.findMany({ where: f(x), select: s })')[0]).toMatch(/\bselect\b/)
  })
})
