/**
 * W1 read switch — which services read from the typed tables instead of Json.
 *
 * Phase P5 moves reads one service at a time. Each switch is independently
 * reversible, so a wrong output shape affects one section of one page rather
 * than the whole profile.
 *
 * Set `W1_READ_TABLES` to a comma-separated list of scopes, or `all`:
 *
 *   W1_READ_TABLES=                      everything reads Json (the default)
 *   W1_READ_TABLES=experience            experience only
 *   W1_READ_TABLES=experience,availability
 *   W1_READ_TABLES=all                   every migrated scope
 *
 * **Default off.** An unset or empty value means Json, which is the behaviour
 * that has been serving production since before this migration started. A
 * missing variable must never silently switch a read path.
 *
 * Reversing: changing the variable in Vercel needs a redeploy to take effect,
 * so it is minutes rather than seconds. The instant path is Vercel's rollback
 * to the previous deployment. Both are far cheaper than reverting code.
 */

export type W1Scope =
  | 'experience'
  | 'availability'
  | 'jobHistory'
  | 'education'
  | 'profilePreview'
  | 'adminWorker'
  | 'workerSearch'

export function readsFromTables(scope: W1Scope): boolean {
  const raw = (process.env.W1_READ_TABLES ?? '').trim()
  if (!raw) return false
  if (raw === 'all') return true
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(scope)
}

/**
 * Log which source served a read, once per scope per process, so a production
 * log makes it obvious whether the switch is actually live. Without this, a
 * misspelled scope name looks exactly like a working Json fallback.
 */
const announced = new Set<string>()

export function announceSource(scope: W1Scope, fromTables: boolean): void {
  if (announced.has(scope)) return
  announced.add(scope)
  console.log(`[w1:read] ${scope} -> ${fromTables ? 'typed tables' : 'json'}`)
}
