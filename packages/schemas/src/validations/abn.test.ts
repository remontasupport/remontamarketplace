// The ABN rule (U2 R5.1, property P8): known values, every single-digit change refused,
// and a generated valid ABN always accepted.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { abnChecksum, EXAMPLE_ABN, isValidAbn, normaliseAbn } from './abn'

/** Any 11-digit string with a valid check: brute-force the last digit from a random prefix. */
const validAbn = fc.stringMatching(/^[0-9]{10}$/).map((prefix) => {
  for (let d = 0; d <= 9; d++) if (abnChecksum(prefix + d)) return prefix + d
  return null
}).filter((v): v is string => v !== null)

describe('abnChecksum', () => {
  it('accepts the ATO example and a few published ABNs, with or without spaces', () => {
    expect(abnChecksum(EXAMPLE_ABN)).toBe(true)
    expect(isValidAbn('51 824 753 556')).toBe(true)
    expect(isValidAbn('53 004 085 616')).toBe(true) // ATO
    expect(isValidAbn('12 004 044 937')).toBe(true) // Commonwealth Bank
  })

  it('refuses the wrong length, letters, and every single-digit change of a valid ABN', () => {
    expect(abnChecksum('5182475355')).toBe(false)
    expect(abnChecksum('518247535560')).toBe(false)
    expect(abnChecksum('5182475355a')).toBe(false)
    expect(isValidAbn('')).toBe(false)
    for (let i = 0; i < 11; i++) {
      for (let d = 0; d <= 9; d++) {
        const changed = EXAMPLE_ABN.slice(0, i) + d + EXAMPLE_ABN.slice(i + 1)
        if (changed !== EXAMPLE_ABN) expect(abnChecksum(changed), changed).toBe(false)
      }
    }
  })

  it('P8: a generated valid ABN is accepted and any one-digit mutation of it is refused', () => {
    fc.assert(
      fc.property(validAbn, fc.integer({ min: 0, max: 10 }), fc.integer({ min: 1, max: 9 }), (abn, pos, delta) => {
        expect(abnChecksum(abn)).toBe(true)
        const mutated = abn.slice(0, pos) + ((Number(abn[pos]) + delta) % 10) + abn.slice(pos + 1)
        expect(abnChecksum(mutated)).toBe(false)
      }),
      { numRuns: 300 },
    )
  })

  it('normaliseAbn strips every kind of whitespace and nothing else', () => {
    expect(normaliseAbn(' 51 824\t753 556 ')).toBe(EXAMPLE_ABN)
    expect(normaliseAbn('51-824')).toBe('51-824')
  })
})
