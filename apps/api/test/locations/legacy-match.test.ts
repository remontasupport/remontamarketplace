// The legacy location matcher: every rule was motivated by the rehearsal on
// production data (2026-09-28). Each rule is a normalisation or an exact, unique
// match; the property at the end is that it never guesses.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { matchLegacyLocation, normalisePostcode, normaliseState, type Candidate } from '../../src/modules/locations/domain/legacy-match'

const C = (id: number, name: string, state: string, postcode: string): Candidate => ({ id, searchName: name, state, postcode })
const world: Candidate[] = [
  C(1, 'mount victoria', 'NSW', '2786'),
  C(2, 'darwin city', 'NT', '0800'),
  C(3, 'parap', 'NT', '0820'),
  C(4, 'the narrows', 'NT', '0820'),
  C(5, 'oran park', 'NSW', '2570'),
  C(6, 'cobbitty', 'NSW', '2570'),
  C(7, 'chipping norton', 'NSW', '2170'),
  C(8, 'liverpool', 'NSW', '2170'),
  C(9, 'epsom', 'VIC', '3551'),
  C(10, 'huntly', 'VIC', '3551'),
  C(11, 'maroochydore', 'QLD', '4558'),
  C(12, 'kuluin', 'QLD', '4558'),
  C(13, 'hobart', 'TAS', '7000'),
  C(14, 'seven hills', 'NSW', '2147'),
  C(15, 'toongabbie', 'NSW', '2147'),
  C(16, 'redbank', 'QLD', '4301'),
  C(17, 'redbank plains', 'QLD', '4301'),
  C(18, 'alice springs', 'NT', '0870'),
  C(19, 'the gap', 'NT', '0870'),
]
const byPostcode = (pc: string) => world.filter((c) => c.postcode === pc)
const loc = (location: string | null, city: string | null = null, state: string | null = null, postalCode: string | null = null) => ({ location, city, state, postalCode })
const match = (l: ReturnType<typeof loc>) => matchLegacyLocation(l, byPostcode)

describe('normalisation', () => {
  it('pads a three-digit postcode (the leading zero the legacy form lost) and refuses anything else', () => {
    expect(normalisePostcode('800')).toBe('0800')
    expect(normalisePostcode(' 2150 ')).toBe('2150')
    expect(normalisePostcode('100001')).toBeNull()
    expect(normalisePostcode('')).toBeNull()
    expect(normalisePostcode(null)).toBeNull()
  })
  it('knows the states by abbreviation, full name, and the legacy "TA"', () => {
    expect(normaliseState(' NSW ')).toBe('NSW')
    expect(normaliseState('TA')).toBe('TAS')
    expect(normaliseState('Australian Capital Territory')).toBe('ACT')
    expect(normaliseState('Fiji')).toBeNull()
  })
})

describe('matchLegacyLocation: the rules the rehearsal motivated', () => {
  it.each([
    ['the plain form string', loc('Mount Victoria, NSW 2786', 'Mount', 'NSW', '2786'), 1, 'location'],
    ['an NT postcode stored with three digits', loc('Parap, NT 820', 'Parap', 'NT', '820'), 3, 'location'],
    ['"TA" for Tasmania', loc('Hobart, TA 7000', 'Hobart', 'TA', '7000'), 13, 'location'],
    ['trailing spaces in the columns', loc(null, 'Oran park ', 'NSW ', '2570'), 5, 'columns'],
    ['a street address before the suburb, city column parsed right', loc('20 Evergreen Dr, Oran Park, NSW 2570', 'Oran park', 'NSW', '2570'), 5, 'columns'],
    ['a street address before the suburb, no usable city column', loc('20 Evergreen Dr, Oran Park, NSW 2570', '20 Evergreen Dr', 'NSW', '2570'), 5, 'suburb-in-text'],
    ['a metro name after the suburb', loc('Chipping Norton, Sydney, NSW 2170', 'Sydney', 'NSW', '2170'), 7, 'suburb-in-text'],
    ['the wrong state with the right suburb and postcode', loc('Epsom, QLD 3551', 'Epsom', 'QLD', '3551'), 9, 'suburb-and-postcode'],
    ['an Australia Post centre name', loc('Maroochydore DC, QLD 4558', 'Maroochydore DC', 'QLD', '4558'), 11, 'location'],
    ['a postcode that belongs to one suburb', loc(null, null, null, '2786'), 1, 'postcode'],
    ['a suburb whose name contains another suburb of the postcode: the longer one was written', loc('37 Samantha Street, Redbank Plains, QLD 4301', null, 'QLD', '4301'), 17, 'suburb-in-text'],
    ['the city column, when apps/app parsed the suburb correctly, before the text', loc('37 Samantha Street, Redbank Plains, QLD 4301', 'Redbank Plains', 'QLD', '4301'), 17, 'columns'],
  ] as const)('%s', (_label, l, id, via) => {
    expect(match(l)).toEqual({ status: 'matched', localityId: id, via })
  })

  it.each([
    ['a metro name with a suburb postcode (which suburb of 2147?)', loc('Sydney, NSW 2147', 'Sydney', 'NSW', '2147'), 'ambiguous'],
    ['a misspelt suburb in a multi-suburb postcode', loc('Parramtta, NSW 2170', 'Parramtta', 'NSW', '2170'), 'ambiguous'],
    ['a street address with no suburb in a multi-suburb postcode', loc('174A Daley Street, NSW 2170', null, 'NSW', '2170'), 'ambiguous'],
    ['an overseas place', loc('Islamabad', 'Islamabad', null, null), 'unmatched'],
    ['nothing at all', loc('', null, null, null), 'unmatched'],
    ['a six-digit postcode', loc('Lagos, Australian Capital Territory, 100001', 'Lagos', 'ACT', '100001'), 'unmatched'],
  ] as const)('never guesses: %s', (_label, l, status) => {
    expect(match(l).status).toBe(status)
  })

  it('a text naming two suburbs of the postcode is ambiguous, not the first one', () => {
    expect(match(loc('Liverpool near Chipping Norton, NSW 2170'))).toMatchObject({ status: 'ambiguous', candidates: 2 })
    // Two real suburbs, neither containing the other: which is theirs is a guess.
    expect(match(loc('1/1 Skinner Street The Gap, Alice Springs, NT 870', 'Alice Springs', 'NT', '870'))).toMatchObject({ status: 'matched', localityId: 18, via: 'columns' })
    expect(match(loc('1/1 Skinner Street The Gap, Alice Springs, NT 870', null, 'NT', '870'))).toMatchObject({ status: 'ambiguous', candidates: 2 })
  })
})

describe('property: a match is always a candidate of the postcode the row named', () => {
  const anyLocation = fc.record({
    location: fc.option(fc.string({ maxLength: 60 }), { nil: null }),
    city: fc.option(fc.string({ maxLength: 30 }), { nil: null }),
    state: fc.option(fc.constantFrom('NSW', 'VIC', 'QLD', 'TA', 'TAS', 'NT', ' NSW ', 'Fiji', 'Victoria'), { nil: null }),
    postalCode: fc.option(fc.constantFrom('2786', '820', '0820', '2570', '2170', '3551', '4558', '7000', '2147', '9999', 'abc', ''), { nil: null }),
  })
  it('holds for any input, and the result is one of the three outcomes', () => {
    fc.assert(
      fc.property(anyLocation, (l) => {
        const r = matchLegacyLocation(l, byPostcode)
        if (r.status !== 'matched') return
        const c = world.find((x) => x.id === r.localityId)!
        const named = new Set([normalisePostcode(l.postalCode), normalisePostcode(/(\d{3,4})\s*$/.exec(l.location ?? '')?.[1])].filter(Boolean))
        expect(named.has(c.postcode)).toBe(true)
      }),
      { numRuns: 500 },
    )
  })
})
