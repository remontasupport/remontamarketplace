// Applies a refresh plan to au_localities, inside one transaction.
//
// Reading, planning and applying all happen under the same table lock, so what is
// applied is exactly what was planned. A dry run plans inside a READ ONLY
// transaction and rolls back. --apply additionally requires --expect=<planHash>
// from a reviewed dry run, so a database that changed in between is refused rather
// than silently refreshed with a different plan.
import type { ClientBase } from 'pg'
import type { LocalityRow } from './csv.js'
import { isEmpty, planHash, planRefresh, type ExistingLocality, type RefreshPlan } from './plan.js'

export interface RefreshOptions {
  rows: readonly LocalityRow[]
  sourceVersion: string
  apply: boolean
  /** Required with apply: the planHash of the reviewed dry run. */
  expect?: string
  appliedBy: string
}

export interface RefreshResult {
  plan: RefreshPlan
  hash: string
  /** Workers placed at each locality the plan retires, by locality id. */
  workersAtRetired: Map<number, number>
  applied: boolean
}

const INSERT_BATCH = 1000 // 8 params per row; PostgreSQL caps a statement at 65,535

export async function runRefresh(db: ClientBase, opts: RefreshOptions): Promise<RefreshResult> {
  await db.query(opts.apply ? 'BEGIN' : 'BEGIN READ ONLY')
  try {
    if (opts.apply) await db.query('LOCK TABLE au_localities IN SHARE ROW EXCLUSIVE MODE')
    const existing = await loadExisting(db)
    const plan = planRefresh(existing, opts.rows)
    const hash = planHash(plan)
    const workersAtRetired = await countWorkers(db, plan.retires.map((r) => r.id))

    if (!opts.apply || isEmpty(plan)) {
      await db.query('ROLLBACK')
      return { plan, hash, workersAtRetired, applied: false }
    }
    if (opts.expect !== hash) {
      throw new Error(
        `plan ${hash} is not the reviewed plan ${opts.expect ?? '(none given)'}: run the dry run again and review it`,
      )
    }
    await applyPlan(db, plan, opts.sourceVersion)
    await db.query(
      `INSERT INTO au_locality_refreshes
         ("sourceVersion","planHash",inserted,updated,restored,retired,unchanged,details,"appliedBy")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        opts.sourceVersion,
        hash,
        plan.inserts.length,
        plan.updates.length,
        plan.restores.length,
        plan.retires.length,
        plan.unchanged,
        JSON.stringify(details(plan, workersAtRetired)),
        opts.appliedBy,
      ],
    )
    await db.query('COMMIT')
    return { plan, hash, workersAtRetired, applied: true }
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  }
}

async function loadExisting(db: ClientBase): Promise<ExistingLocality[]> {
  const { rows } = await db.query<{
    id: number
    localityPid: string
    state: string
    suburb: string
    searchName: string
    postcode: string
    latitude: number
    longitude: number
    retiredAt: Date | null
    supersededById: number | null
  }>(
    `SELECT id,"localityPid",state,suburb,"searchName",postcode,latitude,longitude,"retiredAt","supersededById"
       FROM au_localities`,
  )
  return rows.map(({ retiredAt, ...r }) => ({ ...r, retired: retiredAt !== null }))
}

async function countWorkers(db: ClientBase, ids: number[]): Promise<Map<number, number>> {
  if (ids.length === 0) return new Map()
  const { rows } = await db.query<{ localityId: number; n: string }>(
    `SELECT "localityId", count(DISTINCT "workerProfileId") AS n
       FROM worker_locations WHERE "localityId" = ANY($1::int[]) GROUP BY "localityId"`,
    [ids],
  )
  return new Map(rows.map((r) => [r.localityId, Number(r.n)]))
}

// Mirrors applyInMemory() in plan.ts, step for step: inserts, updates, restores,
// then retires (so a successor inserted by this plan already has an id).
async function applyPlan(db: ClientBase, plan: RefreshPlan, sourceVersion: string): Promise<void> {
  for (let i = 0; i < plan.inserts.length; i += INSERT_BATCH) {
    const batch = plan.inserts.slice(i, i + INSERT_BATCH)
    const values: unknown[] = []
    const tuples = batch.map((r, j) => {
      values.push(r.localityPid, r.suburb, r.searchName, r.state, r.postcode, r.latitude, r.longitude, sourceVersion)
      const b = j * 8
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},now())`
    })
    await db.query(
      `INSERT INTO au_localities
         ("localityPid",suburb,"searchName",state,postcode,latitude,longitude,"sourceVersion","updatedAt")
       VALUES ${tuples.join(',')}`,
      values,
    )
  }
  for (const u of [...plan.updates.map((u) => ({ ...u, restore: false })), ...plan.restores.map((r) => ({ ...r, restore: true }))]) {
    const a = u.after
    await db.query(
      `UPDATE au_localities
          SET suburb=$2,"searchName"=$3,state=$4,latitude=$5,longitude=$6,"sourceVersion"=$7,"updatedAt"=now()
              ${u.restore ? ',"retiredAt"=NULL,"supersededById"=NULL' : ''}
        WHERE id=$1`,
      [u.id, a.suburb, a.searchName, a.state, a.latitude, a.longitude, sourceVersion],
    )
  }
  for (const t of plan.retires) {
    const [pid, postcode] = t.successorKey ? t.successorKey.split('|') : [null, null]
    await db.query(
      `UPDATE au_localities
          SET "retiredAt"=now(),"updatedAt"=now(),
              "supersededById"=(SELECT id FROM au_localities
                                 WHERE "localityPid"=$2 AND postcode=$3 AND "retiredAt" IS NULL)
        WHERE id=$1`,
      [t.id, pid, postcode],
    )
  }
}

function details(plan: RefreshPlan, workers: Map<number, number>) {
  const key = (r: LocalityRow) => `${r.suburb} ${r.state} ${r.postcode} (${r.localityPid})`
  return {
    inserted: plan.inserts.map(key),
    updated: plan.updates.map((u) => ({ id: u.id, before: key(u.before), after: key(u.after) })),
    restored: plan.restores.map((r) => ({ id: r.id, row: key(r.after) })),
    retired: plan.retires.map((r) => ({
      id: r.id,
      row: key(r.row),
      successor: r.successorKey,
      workers: workers.get(r.id) ?? 0,
    })),
  }
}

