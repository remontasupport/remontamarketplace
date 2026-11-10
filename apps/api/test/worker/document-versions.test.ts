// document-history U1: the pure parts and the guard. A re-upload, a worker's delete and a removed service keep the old
// document (R1): the worker module never deletes a document file, and only the admin delete and the retention job may
// (the file deletes are listed here so a new one has to be argued for). The database behaviour is in the .int tests.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { retentionCutoff, VERSION_RETENTION_YEARS } from '../../src/modules/worker/application/document-version-removal'
import { hasFile } from '../../src/modules/worker/application/document-versions'
import { isReplaced } from '../../src/modules/worker/application/service-documents'

const SRC = join(__dirname, '../../src')
const DAY = 86_400_000

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e)
    return statSync(p).isDirectory() ? filesUnder(p) : /\.ts$/.test(e) ? [p] : []
  })
}

describe('document-history: no worker path deletes a document file (R1)', () => {
  it('deleteDocumentFiles is called only by the version removal (admin delete, retention)', () => {
    const callers = filesUnder(SRC)
      .filter((f) => /deleteDocumentFiles\(/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).replace(/\\/g, '/'))
      .sort()
    expect(callers).toEqual(['modules/worker/application/document-version-removal.ts', 'modules/worker/application/service-documents.ts'])
  })

  it('the worker handlers delete from the bucket only the staged copy of a confirm that failed', () => {
    const src = readFileSync(join(SRC, 'modules/worker/worker.handlers.ts'), 'utf8')
    const deletes = [...src.matchAll(/\b(?:bucket|blob)\.delete\(([^)]*)\)/g)].map((m) => m[1])
    expect(deletes.length).toBeGreaterThan(0)
    for (const arg of deletes) expect(arg).toBe('staged.key')
  })
})

describe('retentionCutoff (R5)', () => {
  it('is seven calendar years before now: never later than 7 x 365 days back, never earlier than 7 x 366', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2000-01-01T00:00:00Z'), max: new Date('2200-12-31T23:59:59Z'), noInvalidDate: true }), (now) => {
        const cut = retentionCutoff(now)
        const days = (now.getTime() - cut.getTime()) / DAY
        expect(days).toBeGreaterThanOrEqual(VERSION_RETENTION_YEARS * 365)
        expect(days).toBeLessThanOrEqual(VERSION_RETENTION_YEARS * 366)
        // The time of day is untouched (a version is due at the same instant, seven years on).
        expect(cut.getUTCHours() * 3_600_000 + cut.getUTCMinutes() * 60_000 + cut.getUTCSeconds() * 1000 + cut.getUTCMilliseconds()).toBe(
          now.getUTCHours() * 3_600_000 + now.getUTCMinutes() * 60_000 + now.getUTCSeconds() * 1000 + now.getUTCMilliseconds(),
        )
      }),
    )
  })

  it('is monotonic: a later now never gives an earlier cut-off', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2000-01-01T00:00:00Z'), max: new Date('2200-01-01T00:00:00Z'), noInvalidDate: true }), fc.integer({ min: 0, max: 400 * DAY }), (now, later) => {
        expect(retentionCutoff(new Date(now.getTime() + later)).getTime()).toBeGreaterThanOrEqual(retentionCutoff(now).getTime())
      }),
    )
  })

  it('examples', () => {
    expect(retentionCutoff(new Date('2033-11-11T05:00:00Z')).toISOString()).toBe('2026-11-11T05:00:00.000Z')
    expect(retentionCutoff(new Date('2035-02-28T00:00:00Z')).toISOString()).toBe('2028-02-28T00:00:00.000Z')
  })
})

describe('which rows become versions', () => {
  const row = (storageKey: string | null, documentUrl: string | null) => ({ documentUrl, metadata: storageKey ? { storageKey } : { isCitizen: true } })

  it('hasFile: an own key or a stored URL; a citizenship answer with neither is not kept', () => {
    expect(hasFile(row('documents/p/1.pdf', '/api/documents/r/a.pdf'))).toBe(true)
    expect(hasFile(row(null, 'https://abc.public.blob.vercel-storage.com/x.pdf'))).toBe(true)
    expect(hasFile(row(null, null))).toBe(false)
    expect(hasFile({ documentUrl: null, metadata: null })).toBe(false)
  })

  it('isReplaced: another file on the row is a replacement; the same upload confirmed again, or a row with no file, is not', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), fc.constantFrom('a.pdf', 'b.pdf'), (u1, u2, name) => {
        const k1 = `documents/p/${u1}.pdf`
        const k2 = `documents/p/${u2}.pdf`
        const url = `/api/documents/r/${name}`
        expect(isReplaced(row(k1, url), k1, url)).toBe(false)
        expect(isReplaced(row(k1, url), k2, url)).toBe(u1 !== u2)
        expect(isReplaced(row(null, null), k2, url)).toBe(false)
        expect(isReplaced(row(null, 'https://abc.public.blob.vercel-storage.com/old.pdf'), k2, url)).toBe(true)
      }),
    )
  })
})
