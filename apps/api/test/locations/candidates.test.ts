// The candidate pool the matcher sees must cover every postcode the legacy columns
// mention -- including one that appears only at the end of the `location` string.
// (A broken regex once made that extraction never match, so a worker whose
// postalCode column was empty had no candidates at all.)
import { describe, expect, it } from 'vitest'
import { candidatePool, postcodeInLocation } from '../../src/modules/locations/candidates'
import type { Candidate } from '../../src/modules/locations/domain/legacy-match'

const parramatta: Candidate = { id: 1, searchName: 'parramatta', state: 'NSW', postcode: '2150' }
const darwin: Candidate = { id: 2, searchName: 'darwin', state: 'NT', postcode: '0800' }
const byPostcode: Record<string, Candidate[]> = { '2150': [parramatta], '0800': [darwin] }

describe('postcodeInLocation', () => {
  it.each([
    ['Parramatta, NSW 2150', '2150'],
    ['Parramatta, NSW 2150  ', '2150'],
    ['Darwin, NT 800', '0800'], // a three-digit NT postcode lost its leading zero
    ['20 Evergreen Dr, Oran Park, NSW 2570', '2570'],
    ['Parramatta', null],
    ['', null],
    [null, null],
  ])('%j -> %j', (location, expected) => {
    expect(postcodeInLocation(location)).toBe(expected)
  })
})

describe('candidatePool', () => {
  const asked: string[] = []
  const candidatesFor = async (pc: string) => (asked.push(pc), byPostcode[pc] ?? [])

  it('fetches the postcode named in the location string even when the column is empty', async () => {
    asked.length = 0
    const pool = await candidatePool({ location: 'Parramatta, NSW 2150', postalCode: null }, candidatesFor)
    expect(asked).toEqual(['2150'])
    expect(pool('2150')).toEqual([parramatta])
    expect(pool('2000')).toEqual([])
  })

  it('fetches both when the string and the column disagree, each once', async () => {
    asked.length = 0
    const pool = await candidatePool({ location: 'Darwin, NT 800', postalCode: '2150' }, candidatesFor)
    expect(asked.sort()).toEqual(['0800', '2150'])
    expect(pool('0800')).toEqual([darwin])
    expect(pool('2150')).toEqual([parramatta])
  })

  it('fetches nothing when neither holds a postcode', async () => {
    asked.length = 0
    const pool = await candidatePool({ location: 'Somewhere', postalCode: 'n/a' }, candidatesFor)
    expect(asked).toEqual([])
    expect(pool('2150')).toEqual([])
  })
})
