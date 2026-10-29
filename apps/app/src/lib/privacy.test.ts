// P5 negative test (U2 H7): the home address never reaches a client-facing route or page.
// 1. No client-facing file names the private columns.
// 2. Every worker_profiles read there selects named columns: a read without `select` would
//    return every scalar column, the home street line included, without naming it.
// The admin route (/api/admin/contractors/[id]) is the one place that reads it, masked bank
// account alongside; it is not in these folders.
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { filesUnder, SRC, workerReads } from './sourceScan'

const CLIENT_FACING = ['app/api/client', 'app/api/public', 'app/api/contractors', 'app/api/share', 'app/api/coordinator', 'app/share', 'app/workers']

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
