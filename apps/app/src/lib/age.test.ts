import { describe, expect, it } from 'vitest'
import { ageFrom } from './age'

const today = new Date(2026, 9, 28) // 28 October 2026, local

describe('ageFrom', () => {
  it('counts whole years, one less before this year’s birthday', () => {
    expect(ageFrom('1990-10-28', today)).toBe(36)
    expect(ageFrom('1990-10-29', today)).toBe(35)
    expect(ageFrom('1990-05-01', today)).toBe(36)
  })

  it('reads an ISO date or a Date at midnight UTC as its calendar date', () => {
    expect(ageFrom('1990-10-29T00:00:00.000Z', today)).toBe(35)
    expect(ageFrom(new Date(Date.UTC(1990, 9, 29)), today)).toBe(35)
  })

  it('gives nothing without a usable date', () => {
    expect(ageFrom(null, today)).toBeUndefined()
    expect(ageFrom('', today)).toBeUndefined()
    expect(ageFrom('not a date', today)).toBeUndefined()
  })
})
