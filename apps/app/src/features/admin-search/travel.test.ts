import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { driveMinutesExact, estimatedDriveMinutes, formatDrive, STEP_MINUTES } from './travel'

describe('estimated driving minutes from the straight-line distance', () => {
  it('examples a reader can check by hand', () => {
    // 1.3 km straight -> 1.69 road km at 28 km/h = 3.6 min + 3 = 6.6 -> 5
    expect(estimatedDriveMinutes(1.3)).toBe(5)
    // 10 km -> 13 road km: 3 @28 (6.4) + 7 @35 (12.0) + 3 @45 (4.0) + 3 = 25.4 -> 25
    expect(estimatedDriveMinutes(10)).toBe(25)
    // 50 km -> 65 road km: 6.4 + 12.0 + 26.7 (20 @45) + 35 (35 @60) + 3 = 83.1 -> 85
    expect(estimatedDriveMinutes(50)).toBe(85)
    expect(estimatedDriveMinutes(0)).toBe(STEP_MINUTES)
    expect(estimatedDriveMinutes(Number.NaN)).toBe(STEP_MINUTES)
  })

  it('never shows fewer minutes for a longer distance, and always a multiple of the step, at least the step', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 500, noNaN: true }), fc.double({ min: 0, max: 500, noNaN: true }), (a, b) => {
        const [near, far] = a <= b ? [a, b] : [b, a]
        expect(driveMinutesExact(far)).toBeGreaterThanOrEqual(driveMinutesExact(near))
        const m = estimatedDriveMinutes(far)
        expect(m % STEP_MINUTES).toBe(0)
        expect(m).toBeGreaterThanOrEqual(STEP_MINUTES)
        expect(m).toBeGreaterThanOrEqual(estimatedDriveMinutes(near))
      }),
      { numRuns: 500 },
    )
  })

  it('formats minutes and hours', () => {
    expect(formatDrive(5)).toBe('about 5 min drive')
    expect(formatDrive(55)).toBe('about 55 min drive')
    expect(formatDrive(60)).toBe('about 1 h drive')
    expect(formatDrive(65)).toBe('about 1 h 05 min drive')
    expect(formatDrive(125)).toBe('about 2 h 05 min drive')
  })
})
