// The load script's pure parts (U1 worker-area, R7, U1-SEC-07): the guards, the
// argument parsing, the request mix and the threshold evaluation. No network.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { chooseRequest, evaluate, formatRows, guardTargets, parseArgs, staleTokens, TOKEN_REFRESH_AFTER_MS, type PhaseStats } from '../../scripts/load-worker'

describe('guardTargets (R7.1)', () => {
  const staging = 'https://remonta-api-staging-154148201608.australia-southeast1.run.app'
  const prod = 'https://remonta-api-154148201608.australia-southeast1.run.app'
  const stagingDb = 'postgresql://u:p@ep-wandering-shadow-a7pxwb8o-pooler.ap-southeast-2.aws.neon.tech/neondb'
  const prodDb = 'postgresql://u:p@ep-delicate-recipe-a7mbt4ef-pooler.ap-southeast-2.aws.neon.tech/workerprofiles'

  it('passes for staging only', () => {
    expect(guardTargets(staging, stagingDb)).toEqual([])
  })
  it('refuses the production api, either production database host, a local database and junk', () => {
    expect(guardTargets(prod, stagingDb).join()).toMatch(/not a staging host/)
    expect(guardTargets(staging, prodDb).join()).toMatch(/is production's/)
    expect(guardTargets(staging, 'postgresql://u:p@ep-polished-thunder-1.neon.tech/db').join()).toMatch(/is production's/)
    expect(guardTargets(staging, 'postgresql://postgres:postgres@localhost:55432/s1test').join()).toMatch(/is local/)
    expect(guardTargets('not a url', 'also not').length).toBe(2)
  })
})

describe('parseArgs (R7.3)', () => {
  it('reads the flags in both spellings with the documented defaults and bounds', () => {
    expect(parseArgs(['--base-url', 'https://x/', '--rate=50', '--minutes', '2', '--burst=5', '--workers', '10', '--report', 'out.json'])).toEqual({ baseUrl: 'https://x', workers: 10, rate: 50, minutes: 2, burst: 5, warmupSeconds: 60, report: 'out.json', readsOnly: false })
    expect(parseArgs(['--base-url=https://x'])).toMatchObject({ workers: 100, rate: 25, minutes: 10, burst: 1 })
    expect(() => parseArgs([])).toThrow(/--base-url/)
    expect(() => parseArgs(['--base-url=https://x', '--rate=0'])).toThrow(/--rate/)
    expect(() => parseArgs(['--base-url=https://x', '--burst=21'])).toThrow(/--burst/)
  })
})

describe('chooseRequest (R7.2)', () => {
  it('is 70 % reads (half conditional) and 30 % writes when writes exist; reads only otherwise', () => {
    const tally = (writes: boolean) => {
      const t = { read: 0, 'read-conditional': 0, write: 0 }
      for (let i = 0; i < 10_000; i++) t[chooseRequest(i / 10_000, writes)]++
      return t
    }
    expect(tally(true)).toEqual({ read: 3500, 'read-conditional': 3500, write: 3000 })
    expect(tally(false)).toEqual({ read: 6500, 'read-conditional': 3500, write: 0 })
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (roll) => {
        expect(chooseRequest(roll, false)).not.toBe('write')
      }),
    )
  })
})

const phase = (patch: Partial<PhaseStats> = {}): PhaseStats => ({ requests: 1000, latency: { p50: 50, p95: 120, p99: 300 }, admittedLatency: { p95: 120 }, status: { 200: 700, 304: 300 }, errors: 0, timeouts: 0, lastUnavailableAtS: null, ...patch })

describe('evaluate (U1-PRF-03, NFR requirements Q2)', () => {
  it('passes a clean run and reports every row', () => {
    const v = evaluate({ sustained: phase(), burst: phase({ status: { 200: 400, 304: 100, 503: 500 } }), recovery: phase({ lastUnavailableAtS: 12 }) })
    expect(v.pass).toBe(true)
    expect(v.rows.map((r) => r.phase)).toEqual(['sustained', 'sustained', 'sustained', 'sustained', 'sustained', 'burst', 'burst', 'burst', 'recovery', 'recovery'])
    expect(formatRows(v.rows)).toMatch(/^PASS  sustained  p95 <= 300 ms/)
  })
  it('fails each threshold on its own', () => {
    const fails = (phases: Parameters<typeof evaluate>[0]) => evaluate(phases).rows.filter((r) => !r.pass).map((r) => `${r.phase}: ${r.rule}`)
    expect(fails({ sustained: phase({ latency: { p50: 50, p95: 301, p99: 300 } }) })).toEqual(['sustained: p95 <= 300 ms'])
    expect(fails({ sustained: phase({ latency: { p50: 50, p95: 100, p99: 801 } }) })).toEqual(['sustained: p99 <= 800 ms'])
    expect(fails({ sustained: phase({ status: { 200: 999, 429: 1 } }) })).toEqual(['sustained: no 429'])
    expect(fails({ sustained: phase({ status: { 200: 999, 503: 1 } }) })).toEqual(['sustained: no 503 / 5xx'])
    expect(fails({ sustained: phase({ timeouts: 1 }) })).toEqual(['sustained: no errors or timeouts'])
    expect(fails({ sustained: phase(), burst: phase({ status: { 200: 9, 500: 1 } }) })).toEqual(['burst: no 5xx other than 503'])
    expect(fails({ sustained: phase(), burst: phase({ admittedLatency: { p95: 1001 } }) })).toEqual(['burst: p95 of admitted <= 1000 ms'])
    expect(fails({ sustained: phase(), burst: phase(), recovery: phase({ lastUnavailableAtS: 31 }) })).toEqual(['recovery: no 503 after 30 s'])
    expect(fails({ sustained: phase(), burst: phase(), recovery: phase({ status: { 200: 1, 502: 1 } }) })).toEqual(['recovery: no 5xx other than 503'])
  })
})

describe('staleTokens (R7.2: five-minute tokens, refreshed after four, inside a phase too)', () => {
  it('returns exactly the workers past the refresh age', () => {
    const now = 1_000_000_000
    const workers = [
      { id: 'fresh', mintedAt: now - 1000 },
      { id: 'edge', mintedAt: now - TOKEN_REFRESH_AFTER_MS },
      { id: 'stale', mintedAt: now - TOKEN_REFRESH_AFTER_MS - 1 },
      { id: 'old', mintedAt: now - 600_000 },
    ]
    expect(staleTokens(workers, now).map((w) => w.id)).toEqual(['stale', 'old'])
    expect(TOKEN_REFRESH_AFTER_MS).toBeLessThan(300_000)
  })
})
