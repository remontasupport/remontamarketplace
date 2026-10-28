// The searched place (search-locations U1, BR-P1..P4, P1): a picked suggestion is its suburb; a postcode is its
// suburbs' centre; a name counts when it names one place; nothing else is a place. It never guesses.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { resolvePlace, splitState, type PlaceCandidate, type PlaceLookup } from '../../src/modules/locations/domain/place'

const C = (id: number, name: string, state: string, postcode: string, latitude: number, longitude: number): PlaceCandidate => ({ id, searchName: name, state, postcode, latitude, longitude })
const world: PlaceCandidate[] = [
  C(1, 'parramatta', 'NSW', '2150', -33.81, 151.0),
  C(2, 'parramatta', 'NSW', '2124', -33.81, 151.0), // the same suburb, a second postcode
  C(3, 'harris park', 'NSW', '2150', -33.82, 151.01),
  C(4, 'richmond', 'NSW', '2753', -33.6, 150.75),
  C(5, 'richmond', 'VIC', '3121', -37.82, 145.0),
  C(6, 'darwin city', 'NT', '0800', -12.46, 130.84),
  C(7, 'queenscliff', 'NSW', '2096', -33.78, 151.29),
  C(8, 'queenscliff', 'VIC', '3225', -38.27, 144.66),
]
const lookup = (rows: PlaceCandidate[] = world): PlaceLookup => ({
  byPostcode: async (pc) => rows.filter((c) => c.postcode === pc),
  byName: async (name, state, limit) => rows.filter((c) => c.searchName === name && (!state || c.state === state)).slice(0, limit),
})

describe('BR-P1: a picked suggestion', () => {
  it.each([
    ['Parramatta, NSW 2150', 1],
    ['Harris Park NSW 2150', 3],
    ['Queenscliff, NSW 2096', 7],
    ['Darwin City, NT 800', 6], // a three-digit NT postcode
  ])('%s is its suburb', async (text, id) => {
    const c = world.find((w) => w.id === id)!
    expect(await resolvePlace(text, lookup())).toEqual({ lat: c.latitude, lng: c.longitude, via: 'suburb' })
  })

  it('a suburb that is not in that postcode is no place', async () => {
    expect(await resolvePlace('Richmond, NSW 2150', lookup())).toBeNull()
  })
})

describe('BR-P2: a postcode alone', () => {
  it("is the centre of the postcode's suburbs", async () => {
    const p = await resolvePlace('2150', lookup())
    expect(p?.via).toBe('postcode')
    expect(p?.lat).toBeCloseTo(-33.815, 6)
    expect(p?.lng).toBeCloseTo(151.005, 6)
  })

  it('an unknown postcode is no place', async () => {
    expect(await resolvePlace('9999', lookup())).toBeNull()
  })
})

describe('BR-P3: a name alone', () => {
  it('counts when one suburb has it, even with several postcodes', async () => {
    expect(await resolvePlace('parramatta', lookup())).toEqual({ lat: -33.81, lng: 151.0, via: 'name' })
  })

  it('is no place when several suburbs have it, unless the state settles it', async () => {
    expect(await resolvePlace('Richmond', lookup())).toBeNull()
    expect(await resolvePlace('Richmond VIC', lookup())).toEqual({ lat: -37.82, lng: 145.0, via: 'name' })
    expect(await resolvePlace('richmond, victoria', lookup())).toEqual({ lat: -37.82, lng: 145.0, via: 'name' })
  })

  it('a city that is not a suburb is no place (BR-P4)', async () => {
    expect(await resolvePlace('Gold Coast', lookup())).toBeNull()
  })
})

describe('splitState', () => {
  it('takes one to three trailing words as the state, never the whole text', () => {
    expect(splitState('richmond new south wales')).toEqual({ name: 'richmond', state: 'NSW' })
    expect(splitState('richmond, vic')).toEqual({ name: 'richmond', state: 'VIC' })
    expect(splitState('victoria')).toEqual({ name: 'victoria', state: null })
  })
})

describe('P1: properties', () => {
  const suburb = fc.record({
    name: fc.stringMatching(/^[a-z]{3,10}( [a-z]{3,10})?$/),
    state: fc.constantFrom('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'),
    postcode: fc.integer({ min: 200, max: 9999 }).map((n) => String(n).padStart(4, '0')),
    lat: fc.double({ min: -43, max: -10, noNaN: true }),
    lng: fc.double({ min: 113, max: 153, noNaN: true }),
  })

  it('a suggestion built from any suburb resolves to that suburb', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uniqueArray(suburb, { minLength: 1, maxLength: 8, selector: (s) => `${s.name}|${s.postcode}` }), fc.nat(), async (subs, pick) => {
        const rows = subs.map((s, i) => C(i + 1, s.name, s.state, s.postcode, s.lat, s.lng))
        const target = rows[pick % rows.length]!
        const label = `${target.searchName.replace(/\b\w/g, (c) => c.toUpperCase())}, ${target.state} ${target.postcode}`
        expect(await resolvePlace(label, lookup(rows))).toEqual({ lat: target.latitude, lng: target.longitude, via: 'suburb' })
      }),
    )
  })

  it('never throws, and never names a point that is not a suburb or a postcode centre', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 40 }), async (text) => {
        const p = await resolvePlace(text, lookup())
        if (p && p.via !== 'postcode') expect(world.some((w) => w.latitude === p.lat && w.longitude === p.lng)).toBe(true)
      }),
    )
  })
})
