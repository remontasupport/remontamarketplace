// The worker card's "about N min drive" (user, 2026-10-09: minutes instead of
// kilometres). An ESTIMATE from the straight-line distance between the two suburb
// centres the api returns (`distanceKm`): no routing service, no road data. The
// rule is deliberately simple and visible so it can be tuned or replaced by routed
// times later without touching the card. No React here; tested in node.

/** Straight-line km -> road km (typical Australian road-network detour). */
export const ROAD_FACTOR = 1.3

/** Minutes to get going (parking, turns, the first lights). */
export const FIXED_MINUTES = 3

/** Shown figures are rounded to this many minutes; also the minimum shown. */
export const STEP_MINUTES = 5

/**
 * Average speed by stretch of ROAD distance, applied segment by segment (the first
 * 3 km at 28 km/h, the next 7 at 35, ...), so a longer trip never shows fewer minutes.
 */
export const SPEED_BANDS: ReadonlyArray<{ uptoKm: number; kmh: number }> = [
  { uptoKm: 3, kmh: 28 },
  { uptoKm: 10, kmh: 35 },
  { uptoKm: 30, kmh: 45 },
  { uptoKm: 80, kmh: 60 },
  { uptoKm: Infinity, kmh: 80 },
]

/** Exact (unrounded) driving minutes for a straight-line distance; 0 for 0 or anything invalid. */
export function driveMinutesExact(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0
  let remaining = distanceKm * ROAD_FACTOR
  let from = 0
  let hours = 0
  for (const band of SPEED_BANDS) {
    const span = Math.min(remaining, band.uptoKm - from)
    if (span <= 0) break
    hours += span / band.kmh
    remaining -= span
    from = band.uptoKm
    if (remaining <= 0) break
  }
  return FIXED_MINUTES + hours * 60
}

/** The minutes the card shows: rounded to STEP_MINUTES, never below it. */
export function estimatedDriveMinutes(distanceKm: number): number {
  const exact = driveMinutesExact(distanceKm)
  return Math.max(STEP_MINUTES, Math.round(exact / STEP_MINUTES) * STEP_MINUTES)
}

/** "about 25 min drive" / "about 1 h 05 min drive". */
export function formatDrive(minutes: number): string {
  if (minutes < 60) return `about ${minutes} min drive`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `about ${h} h drive` : `about ${h} h ${String(m).padStart(2, '0')} min drive`
}
