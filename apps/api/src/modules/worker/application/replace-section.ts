// The section write (worker-profile-api U2, R1, L1): one transaction that finds the
// principal's profile (ownership, U1 R1), runs the section's work, recomputes and persists
// the completion flags when the section can change one (R1.4), and records the audit row
// (R1.5: the section and the profile id, never a value). The section's work returns the
// section as stored (R1.2); nothing outside the transaction is touched.
import { PROFILE_UPDATE } from '@remonta/api-contract'
import type { Clock } from '../../../platform/clock'
import type { HandlerContext } from '../../../platform/contract/handlers'
import { statementTimeoutSetting, unitOfWork, type Db, type Tx } from '../../../platform/persistence/db'
import { persistCompletion } from '../domain/persist-completion'
import { readProfileRowsTx } from '../persistence/profile-read'
import { storedCompletion, type CompletionModel } from './completion-items'
import { profileNotFound } from './own-profile'

export interface SectionDeps {
  db: Db
  clock: Clock
  /** onboarding-tour C1 (E6): the stored flags' meaning on this stage (COMPLETION_MODEL); `legacy` when absent. */
  completionModel?: CompletionModel
}

/** A section write's statement timeout, as writeTransaction's default. */
export const SECTION_STATEMENT_TIMEOUT_MS = 5000

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
  const result = await unitOfWork(deps.db, async (tx) => {
    // The statement timeout (as writeTransaction sets it) and the ownership lookup in one statement (audit P5). With
    // no profile there is no row, set_config never runs, and the transaction ends in the 404 below.
    const [profile] = await tx.$queryRaw<OwnProfile[]>`
      SELECT set_config('statement_timeout', ${statementTimeoutSetting(SECTION_STATEMENT_TIMEOUT_MS)}, true) AS "timeout", id, "userId"
        FROM worker_profiles WHERE "userId" = ${principal.userId}`
    if (!profile) throw profileNotFound(principal, ctx.log)
    const own: OwnProfile = { id: profile.id, userId: profile.userId }
    const out = await work(tx, own)
    if (opts.completion) {
      const rows = await readProfileRowsTx(tx, principal.userId)
      // The stored flags come with the re-read: persistCompletion does not read them again (audit P4).
      if (rows) await persistCompletion(tx, own.id, storedCompletion(rows, deps.completionModel ?? 'legacy'), rows.profile)
    }
    await ctx.audit.record(tx, {
      action: PROFILE_UPDATE,
      userId: principal.userId,
      metadata: { section: opts.section, profileId: own.id, ...(principal.impersonatorId ? { impersonatorId: principal.impersonatorId } : {}) },
    })
    return out
  })
  ctx.log.info({ entry: `worker.${opts.section}`, durationMs: Date.now() - started, userId: principal.userId }, 'worker section saved')
  return result
}
