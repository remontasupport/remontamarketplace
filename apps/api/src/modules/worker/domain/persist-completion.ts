// R3.9, L4 (U1 worker-area): the persisted completion. Writes `setupProgress` (the four
// flags) and `profileCompleted` only when they differ from the stored values, and moves
// `verificationStatus` from NOT_STARTED to IN_PROGRESS when any flag becomes true
// (today's intended updateSectionCompletion, minus its PENDING_REVIEW branch, which the
// document paths own). Called inside the writer's transaction by every write that can
// change a flag (U2-U4); U1 ships it with the backfill. Idempotent (P7).
import type { Completion } from '@remonta/api-contract'
import type { Tx } from '../../../platform/persistence/db'
import { flagsOf, type CompletionFlags } from './completion'

const FLAG_KEYS = ['accountDetails', 'compliance', 'trainings', 'services'] as const

/** Today's parseSetupProgress: anything not a boolean is false. */
export function parseStoredFlags(json: unknown): CompletionFlags {
  const o = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>
  return { accountDetails: o.accountDetails === true, compliance: o.compliance === true, trainings: o.trainings === true, services: o.services === true }
}

export function sameFlags(a: CompletionFlags, b: CompletionFlags): boolean {
  return FLAG_KEYS.every((k) => a[k] === b[k])
}

export interface PersistOutcome {
  changed: boolean
  verificationStatus: string
}

export interface StoredCompletion {
  setupProgress: unknown
  profileCompleted: boolean
  verificationStatus: string
}

/**
 * `known`: the three stored columns when the caller has just read them in the same transaction (a section write's
 * completion re-read has them): no second read (audit P4). Without it they are read here.
 */
export async function persistCompletion(tx: Tx, profileId: string, completion: Completion, known?: StoredCompletion): Promise<PersistOutcome> {
  const stored = known ?? (await tx.workerProfile.findUnique({ where: { id: profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true } }))
  if (!stored) throw new Error(`persistCompletion: worker profile ${profileId} not found`)
  const next = flagsOf(completion)
  const unchanged = sameFlags(next, parseStoredFlags(stored.setupProgress)) && completion.profileCompleted === stored.profileCompleted
  if (unchanged) return { changed: false, verificationStatus: stored.verificationStatus }
  const anyTrue = FLAG_KEYS.some((k) => next[k])
  const verificationStatus = stored.verificationStatus === 'NOT_STARTED' && anyTrue ? 'IN_PROGRESS' : stored.verificationStatus
  await tx.workerProfile.update({
    where: { id: profileId },
    data: { setupProgress: next, profileCompleted: completion.profileCompleted, verificationStatus },
    select: { id: true },
  })
  return { changed: true, verificationStatus }
}
