// The stage machine's edges. S1-data-model 3.1 drew ten; the property tests
// (test/onboarding/stage.test.ts) enumerated every change a SINGLE real event can
// cause and found thirteen more. Each is listed with the event that causes it, so
// a reviewer can see why it exists.
//
// The API applies one event per transaction, so it only ever produces these. The
// reconciler samples every 5 minutes and may see several events at once (upload
// then approve: SIGNED_UP straight to VERIFIED); it records such a jump as it is,
// marked as not a single step, rather than inventing intermediate stages.
import type { Stage } from './stage'

export type Edge = `${Stage} -> ${Stage}`

const REMOVED = 'obligations removed until nothing uploaded remains'

export const EDGES: Readonly<Partial<Record<Edge, string>>> = {
  // From S1-data-model 3.1
  'SIGNED_UP -> DOCUMENTS_IN_PROGRESS': 'first mandatory document uploaded',
  'DOCUMENTS_IN_PROGRESS -> DOCUMENTS_SUBMITTED': 'last missing document uploaded',
  'DOCUMENTS_SUBMITTED -> ACTION_REQUIRED': 'a document rejected',
  'DOCUMENTS_IN_PROGRESS -> ACTION_REQUIRED': 'a document rejected',
  'ACTION_REQUIRED -> DOCUMENTS_SUBMITTED': 'replaced; nothing rejected or missing',
  'DOCUMENTS_SUBMITTED -> VERIFIED': 'last document approved',
  'VERIFIED -> PUBLISHED': 'admin publishes',
  'VERIFIED -> ACTION_REQUIRED': 'an approved document expires',
  'PUBLISHED -> ACTION_REQUIRED': 'a document expires, or an obligation appears or is emptied while live',
  'PUBLISHED -> VERIFIED': 'admin unpublishes',
  // Found by the property tests (step 6, 2026-09-25)
  'SIGNED_UP -> DOCUMENTS_SUBMITTED': 'the only mandatory document uploaded',
  'DOCUMENTS_SUBMITTED -> DOCUMENTS_IN_PROGRESS': 'a new obligation before verification (e.g. a service added)',
  'VERIFIED -> DOCUMENTS_IN_PROGRESS': 'a new obligation after verification, not yet published',
  'VERIFIED -> DOCUMENTS_SUBMITTED': 'an approved document replaced early; back to review',
  'ACTION_REQUIRED -> DOCUMENTS_IN_PROGRESS': 'the rejected document replaced; others still missing',
  'ACTION_REQUIRED -> VERIFIED': 'the rejected or expired obligation no longer applies',
  'ACTION_REQUIRED -> PUBLISHED': 'a live worker replaced the rejected or expired document; it awaits review',
  'DOCUMENTS_IN_PROGRESS -> VERIFIED': 'the last missing obligation no longer applies',
  'PUBLISHED -> DOCUMENTS_SUBMITTED': 'admin unpublishes while a replacement awaits review',
  'DOCUMENTS_IN_PROGRESS -> SIGNED_UP': REMOVED,
  'DOCUMENTS_SUBMITTED -> SIGNED_UP': REMOVED,
  'ACTION_REQUIRED -> SIGNED_UP': REMOVED,
  'VERIFIED -> SIGNED_UP': REMOVED,
}

export function isEdge(from: Stage, to: Stage): boolean {
  return `${from} -> ${to}` in EDGES
}

export interface StageChange {
  from: Stage | null
  to: Stage
  /** False when the reconciler saw several events at once. */
  singleStep: boolean
  cause: string
}

/** The change to record, or null if the stage did not change. */
export function changeOf(from: Stage | null, to: Stage, cause: string): StageChange | null {
  if (from === to) return null
  return { from, to, singleStep: from === null ? to === 'SIGNED_UP' : isEdge(from, to), cause }
}
