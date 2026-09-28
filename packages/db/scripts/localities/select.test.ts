import { describe, expect, it } from 'vitest'
import { plausiblePostcode } from './select.js'

describe('plausiblePostcode (rule 2 fallback only)', () => {
  it.each([
    ['NSW', '2582', true],
    ['ACT', '2602', true],
    ['NT', '0800', true],
    ['OT', '6798', true], // Christmas Island
    ['OT', '2540', true], // Jervis Bay
    ['QLD', '4810', true],
    ['QLD', '9998', false], // G-NAF placeholder, though QLD does use 9xxx
    ['ACT', '9999', false],
    ['NSW', '0000', false],
    ['VIC', '2000', false], // another state's range
    ['WA', '600', false],
    ['SA', '5a00', false],
  ])('%s %s -> %s', (state, postcode, ok) => {
    expect(plausiblePostcode(state, postcode)).toBe(ok)
  })
})
