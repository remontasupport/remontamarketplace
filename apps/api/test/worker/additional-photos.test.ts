// The extra photos (2026-10-23): the pure rules -- reading the stored JSON array, placing an upload, removing one.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { parseAdditionalPhotos, placeAdditional, swapMain, withoutAdditional } from '../../src/modules/worker/application/photos'

const url = fc.webUrl()
const photosArb = fc.record({ main: fc.option(url, { nil: null }), additional: fc.uniqueArray(url, { maxLength: 4 }) })

describe('parseAdditionalPhotos', () => {
  it('a stored array of strings round-trips; anything else reads as none', () => {
    fc.assert(fc.property(fc.uniqueArray(url, { maxLength: 10 }), (a) => {
      expect(parseAdditionalPhotos(a.length ? JSON.stringify(a) : null)).toEqual(a)
    }))
    for (const bad of ['not json', '{"a":1}', '42', 'null', '']) expect(parseAdditionalPhotos(bad)).toEqual([])
    expect(parseAdditionalPhotos(JSON.stringify(['https://x.test/a.jpg', 3, '', null]))).toEqual(['https://x.test/a.jpg'])
  })
})

describe('placeAdditional', () => {
  it('appends while under 2 with a main photo; refuses at 2; with no main it becomes the main (worker) or is refused (admin)', () => {
    fc.assert(
      fc.property(photosArb, url, fc.boolean(), (current, u, mainIfNone) => {
        const next = placeAdditional(current, u, mainIfNone)
        if (current.main === null) {
          if (mainIfNone) expect(next).toEqual({ main: u, additional: current.additional })
          else expect(next).toHaveProperty('refused')
        } else if (current.additional.length >= 2) expect(next).toHaveProperty('refused')
        else expect(next).toEqual({ main: current.main, additional: [...current.additional, u] })
      }),
    )
  })
})

describe('withoutAdditional', () => {
  it('removes exactly that extra photo; never the main; refuses an address that is not an extra photo', () => {
    fc.assert(
      fc.property(photosArb, (current) => {
        for (const u of current.additional) {
          const next = withoutAdditional(current, u)
          expect(next).toEqual({ main: current.main, additional: current.additional.filter((x) => x !== u) })
        }
        if (current.main && !current.additional.includes(current.main)) expect(withoutAdditional(current, current.main)).toHaveProperty('refused')
      }),
    )
  })
})

describe('swapMain (Replace photo with an extra photo)', () => {
  it('the chosen extra becomes the main, the old main takes its slot; the set of photos is unchanged; anything else is refused', () => {
    fc.assert(
      fc.property(photosArb, (current) => {
        for (const u of current.additional) {
          const next = swapMain(current, u)
          if ('refused' in next) throw new Error('refused an extra photo')
          expect(next.main).toBe(u)
          expect(next.additional.length).toBe(current.main ? current.additional.length : current.additional.length - 1)
          expect([next.main, ...next.additional].sort()).toEqual([...(current.main ? [current.main] : []), ...current.additional].sort())
          if (current.main) expect(next.additional[current.additional.indexOf(u)]).toBe(current.main)
        }
        if (current.main && !current.additional.includes(current.main)) expect(swapMain(current, current.main)).toHaveProperty('refused')
      }),
    )
  })
})
