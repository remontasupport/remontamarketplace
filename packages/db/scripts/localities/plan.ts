// The refresh plan: what to change in au_localities so its current rows match the
// CSV. Pure, so the guarantees below are property-tested (plan.test.ts):
//   - no row is ever deleted, so no worker_locations row is ever orphaned;
//   - after applying, the current (not retired) rows are exactly the CSV;
//   - a matched row keeps its id, so every worker's link survives an update;
//   - planning again against the result is empty (idempotent).
import { createHash } from 'node:crypto'
import { rowKey, type LocalityRow } from './csv.js'

export interface ExistingLocality extends LocalityRow {
  id: number
  retired: boolean
  supersededById?: number | null
}

export interface RetireStep {
  id: number
  row: LocalityRow
  /** Key of the current row that replaces it, when one can be named unambiguously. */
  successorKey: string | null
}

export interface RefreshPlan {
  inserts: LocalityRow[]
  /** Current rows whose name, state or centroid changed. */
  updates: { id: number; before: LocalityRow; after: LocalityRow }[]
  /** Retired rows that are back in the CSV. */
  restores: { id: number; after: LocalityRow }[]
  retires: RetireStep[]
  unchanged: number
  alreadyRetired: number
}

const FIELDS = ['suburb', 'searchName', 'state', 'latitude', 'longitude'] as const

function sameContent(a: LocalityRow, b: LocalityRow): boolean {
  return FIELDS.every((f) => a[f] === b[f])
}

function pick(r: LocalityRow): LocalityRow {
  const { localityPid, state, suburb, searchName, postcode, latitude, longitude } = r
  return { localityPid, state, suburb, searchName, postcode, latitude, longitude }
}

export function planRefresh(existing: readonly ExistingLocality[], incoming: readonly LocalityRow[]): RefreshPlan {
  const byKey = new Map<string, ExistingLocality>()
  for (const e of existing) {
    const k = rowKey(e)
    if (byKey.has(k)) throw new Error(`database has two rows for ${k}`)
    byKey.set(k, e)
  }
  const incomingByKey = new Map<string, LocalityRow>()
  for (const r of incoming) {
    const k = rowKey(r)
    if (incomingByKey.has(k)) throw new Error(`CSV has two rows for ${k}`)
    incomingByKey.set(k, r)
  }

  const plan: RefreshPlan = { inserts: [], updates: [], restores: [], retires: [], unchanged: 0, alreadyRetired: 0 }
  for (const [k, r] of incomingByKey) {
    const e = byKey.get(k)
    if (!e) plan.inserts.push(pick(r))
    else if (e.retired) plan.restores.push({ id: e.id, after: pick(r) })
    else if (!sameContent(e, r)) plan.updates.push({ id: e.id, before: pick(e), after: pick(r) })
    else plan.unchanged++
  }

  // Successors: the same locality under its one remaining postcode, else the one
  // current row with the same name, state and postcode (a re-issued PID).
  const byPid = groupBy(incomingByKey.values(), (r) => r.localityPid)
  const byPlace = groupBy(incomingByKey.values(), (r) => `${r.searchName}|${r.state}|${r.postcode}`)
  for (const [k, e] of byKey) {
    if (incomingByKey.has(k)) continue
    if (e.retired) {
      plan.alreadyRetired++
      continue
    }
    const samePid = byPid.get(e.localityPid) ?? []
    const samePlace = byPlace.get(`${e.searchName}|${e.state}|${e.postcode}`) ?? []
    const successor = samePid.length === 1 ? samePid[0] : samePlace.length === 1 ? samePlace[0] : undefined
    plan.retires.push({ id: e.id, row: pick(e), successorKey: successor ? rowKey(successor) : null })
  }

  plan.inserts.sort(byKeyOrder)
  plan.updates.sort((a, b) => a.id - b.id)
  plan.restores.sort((a, b) => a.id - b.id)
  plan.retires.sort((a, b) => a.id - b.id)
  return plan
}

export function isEmpty(p: RefreshPlan): boolean {
  return p.inserts.length + p.updates.length + p.restores.length + p.retires.length === 0
}

/** Identifies a plan, so --apply can refuse anything but the plan that was reviewed. */
export function planHash(p: RefreshPlan): string {
  const { unchanged: _u, alreadyRetired: _a, ...changes } = p
  return createHash('sha256').update(JSON.stringify(changes)).digest('hex').slice(0, 16)
}

/**
 * The plan applied to an in-memory table -- the model the property tests check and
 * the SQL applier (refresh-db.ts) mirrors. New rows take ids from nextId upward.
 */
export function applyInMemory(existing: readonly ExistingLocality[], plan: RefreshPlan, nextId: number) {
  const rows = new Map<number, ExistingLocality>()
  for (const e of existing) rows.set(e.id, { ...e, supersededById: e.supersededById ?? null })
  for (const r of plan.inserts) rows.set(nextId, { ...r, id: nextId++, retired: false, supersededById: null })
  for (const u of plan.updates) Object.assign(rows.get(u.id)!, u.after)
  for (const s of plan.restores) Object.assign(rows.get(s.id)!, s.after, { retired: false, supersededById: null })
  const currentByKey = new Map([...rows.values()].filter((r) => !r.retired).map((r) => [rowKey(r), r.id]))
  for (const t of plan.retires) {
    const row = rows.get(t.id)!
    row.retired = true
    row.supersededById = t.successorKey ? (currentByKey.get(t.successorKey) ?? null) : null
  }
  return [...rows.values()]
}

function groupBy<T>(items: Iterable<T>, key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const i of items) {
    const k = key(i)
    const list = m.get(k)
    if (list) list.push(i)
    else m.set(k, [i])
  }
  return m
}

function byKeyOrder(a: LocalityRow, b: LocalityRow): number {
  const ka = rowKey(a)
  const kb = rowKey(b)
  return ka < kb ? -1 : ka > kb ? 1 : 0
}
