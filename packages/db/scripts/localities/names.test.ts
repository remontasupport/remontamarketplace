import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { displayName, searchName } from './names.js'

describe('displayName', () => {
  it.each([
    ['PARRAMATTA', 'Parramatta'],
    ['ST KILDA EAST', 'St Kilda East'],
    ["O'CONNOR", "O'Connor"],
    ["TAM O'SHANTER", "Tam O'Shanter"],
    ["YATEMAN'S BORE", "Yateman's Bore"],
    ["STUN'SAIL BOOM", "Stun'sail Boom"],
    ['MCMAHONS POINT', 'McMahons Point'],
    ['MACQUARIE', 'Macquarie'],
    ['TI-TREE', 'Ti-Tree'],
    ['YALLA-Y-POORA', 'Yalla-Y-Poora'],
    ['WEST IS COCOS (KEELING)', 'West Is Cocos (Keeling)'],
    ['O.B. FLAT', 'O.B. Flat'],
    ['10 MILE', '10 Mile'],
    ['  BONNY   HILLS ', 'Bonny Hills'],
  ])('%s -> %s', (raw, expected) => {
    expect(displayName(raw)).toBe(expected)
  })
})

// G-NAF-shaped names: capitals, digits and the punctuation the release uses.
const gnafName = fc
  .array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \'-().'.split('')), { minLength: 1, maxLength: 30 })
  .map((cs) => cs.join(''))

describe('displayName properties', () => {
  it('never changes what search matches', () => {
    fc.assert(fc.property(gnafName, (n) => searchName(displayName(n)) === searchName(n)))
  })
  it('is idempotent', () => {
    fc.assert(fc.property(gnafName, (n) => displayName(displayName(n)) === displayName(n)))
  })
  it('does not depend on the input casing', () => {
    fc.assert(fc.property(gnafName, (n) => displayName(n.toLowerCase()) === displayName(n)))
  })
})
