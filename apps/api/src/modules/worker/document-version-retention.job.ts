// document-history U1 (R5): daily, the versions superseded more than seven years ago are deleted with their files.
// DOCUMENT_VERSION_RETENTION=report (the default, the first release) only counts them; apply deletes. One transaction
// per version, so a failure leaves that version for the next run and never an orphan row.
import type { Job } from '../../platform/jobs/scheduler'
import { unitOfWork, type Db } from '../../platform/persistence/db'
import { deleteRemovedFile, removeVersion, retentionCutoff, type VersionStores } from './application/document-version-removal'

export type RetentionMode = 'report' | 'apply'

export interface RetentionDeps {
  db: Db
  stores: VersionStores
  log: { warn(o: object, m: string): void }
  mode: RetentionMode
  batch?: number
}

export function documentVersionRetentionJob(deps: RetentionDeps): Job {
  return {
    name: 'document-version-retention',
    everyMs: 24 * 3_600_000,
    timeoutMs: 10 * 60_000,
    async run({ now, signal }) {
      const before = retentionCutoff(now)
      const due = { supersededAt: { lt: before } }
      if (deps.mode === 'report') return { summary: { mode: 'report', before: before.toISOString(), due: await deps.db.documentVersion.count({ where: due }) } }
      const ids = await deps.db.documentVersion.findMany({ where: due, select: { id: true }, orderBy: { supersededAt: 'asc' }, take: deps.batch ?? 500 })
      let deleted = 0
      let filesDeleted = 0
      let failed = 0
      for (const { id } of ids) {
        if (signal.aborted) break
        try {
          const removed = await unitOfWork(deps.db, (tx) => removeVersion(tx, id))
          if (!removed) continue
          deleted++
          if (removed.file) {
            await deleteRemovedFile(deps.stores, removed, deps.log)
            filesDeleted++
          }
        } catch (err) {
          failed++
          deps.log.warn({ job: 'document-version-retention', err: err instanceof Error ? err.message : String(err) }, 'document version not deleted')
        }
      }
      return { summary: { mode: 'apply', before: before.toISOString(), candidates: ids.length, deleted, filesDeleted, failed } }
    },
  }
}
