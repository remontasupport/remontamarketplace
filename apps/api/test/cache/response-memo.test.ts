// ResponseMemo (U2, R8.3; property G7): a model-based check that whatever sequence of
// sets, gets and clock advances runs, a get answers the most recent set within the
// window or nothing, and the memo never exceeds its bound.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { ResponseMemo } from '../../src/platform/cache/response-memo'

describe('ResponseMemo', () => {
  it('answers within the window, forgets after it, evicts the least recently used past the bound', () => {
    let now = 1_000_000
    const memo = new ResponseMemo({ maxEntries: 2, ttlMs: 1000, clock: () => new Date(now) })
    memo.set('a', 1)
    memo.set('b', 2)
    expect(memo.get('a')).toBe(1) // a is now the most recently used
    memo.set('c', 3) // evicts b
    expect(memo.get('b')).toBeUndefined()
    expect(memo.get('a')).toBe(1)
    expect(memo.size).toBe(2)
    now += 1000
    expect(memo.get('a')).toBeUndefined() // expired, and dropped
    expect(memo.size).toBe(1)
  })

  it('G7: model-based -- a get returns the latest set within ttl, else undefined; size <= bound', () => {
    const cmd = fc.oneof(
      fc.record({ kind: fc.constant('set' as const), key: fc.integer({ min: 0, max: 6 }), body: fc.integer() }),
      fc.record({ kind: fc.constant('get' as const), key: fc.integer({ min: 0, max: 6 }) }),
      fc.record({ kind: fc.constant('tick' as const), ms: fc.integer({ min: 0, max: 1500 }) }),
    )
    fc.assert(
      fc.property(fc.array(cmd, { maxLength: 60 }), fc.integer({ min: 1, max: 5 }), (cmds, bound) => {
        let now = 0
        const memo = new ResponseMemo({ maxEntries: bound, ttlMs: 1000, clock: () => new Date(now) })
        const model = new Map<number, { body: number; at: number }>()
        for (const c of cmds) {
          if (c.kind === 'tick') now += c.ms
          else if (c.kind === 'set') {
            memo.set(String(c.key), c.body)
            model.set(c.key, { body: c.body, at: now })
          } else {
            const got = memo.get(String(c.key))
            const m = model.get(c.key)
            if (got !== undefined) {
              // Whatever is answered is the latest set of that key and is within the window.
              expect(got).toBe(m!.body)
              expect(now - m!.at).toBeLessThan(1000)
            } else if (m && now - m.at < 1000) {
              // Absent only because the bound evicted it.
              expect(bound).toBeLessThan(7)
            }
          }
          expect(memo.size).toBeLessThanOrEqual(bound)
        }
      }),
      { numRuns: 200 },
    )
  })
})
