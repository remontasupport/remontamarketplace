import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { rowKey, type LocalityRow } from './csv.js'
import { applyInMemory, isEmpty, planHash, planRefresh, type ExistingLocality } from './plan.js'

// A small key space, so existing and incoming overlap often: the interesting cases
// (update, restore, retire with successor) need shared keys.
const pid = fc.constantFrom('locA', 'locB', 'locC', 'locD', 'locE')
const postcode = fc.constantFrom('2000', '2001', '3000', '3004')
const content = fc.record({
  suburb: fc.constantFrom('Alpha', 'Beta', 'Gamma'),
  state: fc.constantFrom('NSW', 'VIC'),
  latitude: fc.constantFrom(-33.8, -37.8),
  longitude: fc.constantFrom(151.2, 144.9),
})
const row: fc.Arbitrary<LocalityRow> = fc
  .record({ localityPid: pid, postcode, c: content })
  .map(({ localityPid, postcode, c }) => ({ localityPid, postcode, ...c, searchName: c.suburb.toLowerCase() }))
const rows = fc.uniqueArray(row, { maxLength: 20, selector: rowKey })

const table: fc.Arbitrary<ExistingLocality[]> = fc
  .tuple(rows, fc.array(fc.boolean(), { minLength: 20, maxLength: 20 }))
  .map(([rs, retired]) => rs.map((r, i) => ({ ...r, id: i + 1, retired: retired[i] ?? false })))

const scenario = fc.record({
  existing: table,
  incoming: rows,
  /** worker_locations: each worker placed at some existing locality id */
  workers: fc.array(fc.nat({ max: 19 }), { maxLength: 10 }),
})

const NEXT_ID = 1000
const content_ = (r: LocalityRow) => [r.localityPid, r.postcode, r.suburb, r.searchName, r.state, r.latitude, r.longitude].join('|')

describe('planRefresh properties', () => {
  it('never deletes a row, so no worker location is ever orphaned', () => {
    fc.assert(
      fc.property(scenario, ({ existing, incoming, workers }) => {
        const after = applyInMemory(existing, planRefresh(existing, incoming), NEXT_ID)
        const ids = new Map(after.map((r) => [r.id, r]))
        for (const e of existing) expect(rowKey(ids.get(e.id)!)).toBe(rowKey(e))
        for (const w of workers) {
          const placedAt = existing[w]
          if (placedAt) expect(ids.has(placedAt.id)).toBe(true)
        }
      }),
    )
  })

  it('leaves the current rows exactly equal to the CSV', () => {
    fc.assert(
      fc.property(scenario, ({ existing, incoming }) => {
        const after = applyInMemory(existing, planRefresh(existing, incoming), NEXT_ID)
        const current = after.filter((r) => !r.retired).map(content_).sort()
        expect(current).toEqual(incoming.map(content_).sort())
      }),
    )
  })

  it('keeps the id of every row it matches', () => {
    fc.assert(
      fc.property(scenario, ({ existing, incoming }) => {
        const after = applyInMemory(existing, planRefresh(existing, incoming), NEXT_ID)
        const idByKey = new Map(after.map((r) => [rowKey(r), r.id]))
        for (const e of existing) expect(idByKey.get(rowKey(e))).toBe(e.id)
      }),
    )
  })

  it('is idempotent: planning again against the result changes nothing', () => {
    fc.assert(
      fc.property(scenario, ({ existing, incoming }) => {
        const after = applyInMemory(existing, planRefresh(existing, incoming), NEXT_ID)
        expect(isEmpty(planRefresh(after, incoming))).toBe(true)
      }),
    )
  })

  it('only ever names a current row as a successor', () => {
    fc.assert(
      fc.property(scenario, ({ existing, incoming }) => {
        const plan = planRefresh(existing, incoming)
        const byId = new Map(applyInMemory(existing, plan, NEXT_ID).map((r) => [r.id, r]))
        for (const t of plan.retires) {
          const retired = byId.get(t.id)!
          expect(retired.retired).toBe(true)
          if (t.successorKey === null) expect(retired.supersededById).toBeNull()
          else expect(byId.get(retired.supersededById!)?.retired).toBe(false)
        }
      }),
    )
  })

  it('hashes the same plan the same way and a different plan differently', () => {
    fc.assert(
      fc.property(scenario, rows, ({ existing, incoming }, other) => {
        const a = planRefresh(existing, incoming)
        expect(planHash(planRefresh(existing, incoming))).toBe(planHash(a))
        const b = planRefresh(existing, other)
        if (JSON.stringify({ ...a, unchanged: 0, alreadyRetired: 0 }) !== JSON.stringify({ ...b, unchanged: 0, alreadyRetired: 0 })) {
          expect(planHash(b)).not.toBe(planHash(a))
        }
      }),
    )
  })
})

describe('planRefresh examples', () => {
  const r = (localityPid: string, postcode: string, suburb = 'Melbourne', latitude = -37.8): LocalityRow => ({
    localityPid, postcode, suburb, searchName: suburb.toLowerCase(), state: 'VIC', latitude, longitude: 144.9,
  })
  const e = (id: number, row: LocalityRow, retired = false): ExistingLocality => ({ ...row, id, retired })

  it('names the remaining postcode as the successor when a suburb loses one', () => {
    const p = planRefresh([e(1, r('locMEL', '3000')), e(2, r('locMEL', '3004'))], [r('locMEL', '3000')])
    expect(p.retires).toEqual([{ id: 2, row: r('locMEL', '3004'), successorKey: 'locMEL|3000' }])
  })

  it('names a re-issued PID with the same name and postcode as the successor', () => {
    const p = planRefresh([e(1, r('locOLD', '3000'))], [r('locNEW', '3000')])
    expect(p.retires[0]?.successorKey).toBe('locNEW|3000')
  })

  it('names no successor when it would be a guess', () => {
    const p = planRefresh([e(1, r('locX', '3000'))], [r('locX', '3001'), r('locX', '3002')])
    expect(p.retires[0]?.successorKey).toBeNull()
  })

  it('restores a retired row that comes back, keeping its id', () => {
    const p = planRefresh([e(7, r('locMEL', '3004'), true)], [r('locMEL', '3004')])
    expect(p.restores).toEqual([{ id: 7, after: r('locMEL', '3004') }])
  })

  it('refuses duplicate keys on either side', () => {
    expect(() => planRefresh([], [r('a', '3000'), r('a', '3000', 'Other')])).toThrow(/two rows/)
    expect(() => planRefresh([e(1, r('a', '3000')), e(2, r('a', '3000'))], [])).toThrow(/two rows/)
  })
})
