// The section write (worker-profile-api U2, R1, L1): one transaction that finds the
// principal's profile (ownership, U1 R1), runs the section's work, recomputes and persists
// the completion flags when the section can change one (R1.4), and records the audit row
// (R1.5: the section and the profile id, never a value). The section's work returns the
// section as stored (R1.2); nothing outside the transaction is touched.
import { PROFILE_UPDATE } from '@remonta/api-contract'
import type { Clock } from '../../../platform/clock'
import type { HandlerContext } from '../../../platform/contract/handlers'
import { writeTransaction, type Db, type Tx } from '../../../platform/persistence/db'
import { completionOf } from '../domain/completion'
import { persistCompletion } from '../domain/persist-completion'
import { readProfileRowsTx } from '../persistence/profile-read'
import { completionInputOf } from './get-profile'
import { profileNotFound } from './own-profile'

export interface SectionDeps {
  db: Db
  clock: Clock
}

export interface OwnProfile {
  id: string
  userId: string
}

export async function replaceSection<T>(
  deps: SectionDeps,
  ctx: HandlerContext,
  opts: { section: string; completion: boolean },
  work: (tx: Tx, profile: OwnProfile) => Promise<T>,
): Promise<T> {
  const principal = ctx.principal!
  const started = Date.now()
  const result = await writeTransaction(deps.db, async (tx) => {
    const profile = await tx.workerProfile.findUnique({ where: { userId: principal.userId }, select: { id: true, userId: true } })
    if (!profile) throw profileNotFound(principal, ctx.log)
    const out = await work(tx, profile)
    if (opts.completion) {
      const rows = await readProfileRowsTx(tx, principal.userId)
      if (rows) await persistCompletion(tx, profile.id, completionOf(completionInputOf(rows)))
    }
    await ctx.audit.record(tx, {
      action: PROFILE_UPDATE,
      userId: principal.userId,
      metadata: { section: opts.section, profileId: profile.id, ...(principal.impersonatorId ? { impersonatorId: principal.impersonatorId } : {}) },
    })
    return out
  })
  ctx.log.info({ entry: `worker.${opts.section}`, durationMs: Date.now() - started, userId: principal.userId }, 'worker section saved')
  return result
}
