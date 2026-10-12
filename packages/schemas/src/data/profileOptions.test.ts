import { describe, expect, it } from 'vitest'
import { ADDITIONAL_INFO_GROUPS, CULTURAL_BACKGROUNDS, DAYS, GENDERS, INTERESTS, LANGUAGES, MONTHS, monthIndex, PERSONALITIES, RELIGIONS, UNIQUE_SERVICES, WORK_PREFERENCES } from './profileOptions'

describe('the profile option lists (U2 R7)', () => {
  const lists = { LANGUAGES, CULTURAL_BACKGROUNDS, RELIGIONS, INTERESTS, WORK_PREFERENCES, UNIQUE_SERVICES, PERSONALITIES, GENDERS, MONTHS, DAYS, ADDITIONAL_INFO_GROUPS }
  it.each(Object.entries(lists))('%s is non-empty, trimmed and duplicate-free', (_name, list) => {
    expect(list.length).toBeGreaterThan(0)
    for (const v of list) expect(v).toBe(v.trim())
    expect(new Set(list).size).toBe(list.length)
  })
  it('keeps the counts the components held on 2026-10-12', () => {
    expect(LANGUAGES).toHaveLength(32)
    expect(CULTURAL_BACKGROUNDS).toHaveLength(21)
    expect(RELIGIONS).toHaveLength(15)
    expect(INTERESTS).toHaveLength(11)
    expect(WORK_PREFERENCES).toHaveLength(5)
    expect(UNIQUE_SERVICES).toHaveLength(42)
    expect(MONTHS).toHaveLength(12)
    expect(DAYS).toHaveLength(7)
    expect(ADDITIONAL_INFO_GROUPS).toHaveLength(8)
  })
  it('monthIndex', () => {
    expect(monthIndex('January')).toBe(0)
    expect(monthIndex('December')).toBe(11)
    expect(monthIndex('Jan')).toBe(-1)
  })
})
