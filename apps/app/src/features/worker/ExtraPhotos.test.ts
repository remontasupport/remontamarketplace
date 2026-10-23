// The extra photos (2026-10-23): what the add button offers, for the worker and for an admin.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { addStateOf } from './ExtraPhotos'

const url = fc.webUrl()

describe('addStateOf', () => {
  it('nothing loaded: no button and no reason', () => {
    expect(addStateOf(null, false)).toEqual({ canAdd: false, reason: null })
  })

  it('under 2 extras it offers Add; at 2 it says the limit; an admin needs a main photo first', () => {
    fc.assert(
      fc.property(fc.option(url, { nil: null }), fc.uniqueArray(url, { maxLength: 4 }), fc.boolean(), (main, additional, requireMain) => {
        const s = addStateOf({ main, additional }, requireMain)
        if (requireMain && !main) expect(s).toEqual({ canAdd: false, reason: 'Add a main photo first.' })
        else if (additional.length >= 2) expect(s).toEqual({ canAdd: false, reason: 'At most 2 extra photos.' })
        else expect(s).toEqual({ canAdd: true, reason: null })
      }),
    )
  })
})
