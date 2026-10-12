// The sidebar's two requirement groups in the profile read (U1 worker-area, R4, L5).
// Pure. Today's source: apps/app's `GET /api/worker/requirements` (the splice of the
// code-of-conduct steps after abn-contractor), `utils/dynamicComplianceSteps.ts`
// (part 2 dropped) and `utils/dynamicTrainingSteps.ts` (the three NDIS modules folded
// into ndis-worker-orientation; TRAINING_STEP_ORDER). The constants below are copies
// of those files' lists, 2026-10-12; the app's copies go when the sidebar reads this.
import type { RequirementItem, RequirementItemStatus } from '@remonta/api-contract'
import {
  BASE_COMPLIANCE_CATEGORIES,
  baseType,
  CODE_OF_CONDUCT_PART1,
  CODE_OF_CONDUCT_PART2,
  hasValidAbn,
  satisfiers,
  TRAINING_ALIASES,
  TRAINING_CATEGORY,
  type CatalogueRows,
  type ProfileColumns,
  type RequirementRow,
  type RequirementStatus,
  type ServiceRow,
} from './completion'

/** apps/app/src/utils/dynamicTrainingSteps.ts: TRAINING_STEP_ORDER. Unknown ids keep their catalogue order, after these. */
export const TRAINING_STEP_ORDER: readonly string[] = [
  'ndis-worker-orientation',
  'infection-control-training',
  'infection-control',
  'first-aid-cpr',
  'first-aid',
  'cpr',
  'manual-handling',
  'medication-training',
  'behaviour-support',
]

/** apps/app/src/utils/dynamicTrainingSteps.ts: COMBINED_NDIS_TRAININGS, shown on the ndis-worker-orientation page. */
export const FOLDED_TRAINING_IDS: ReadonlySet<string> = new Set(['ndis-induction-module', 'effective-communication', 'safe-enjoyable-meals'])

const CODE_OF_CONDUCT_PART1_NAME = 'Code of Conduct (Part 1)'

export interface RequirementGroupsInput {
  profile: Pick<ProfileColumns, 'abn' | 'hasVehicle'>
  services: ServiceRow[]
  requirements: RequirementRow[]
  catalogue: CatalogueRows
}

export interface RequirementGroups {
  mandatory: RequirementItem[]
  trainings: RequirementItem[]
}

interface Doc {
  id: string
  name: string
  category: string
  documentType: 'REQUIRED' | 'OPTIONAL'
}

/** The catalogue documents linked to the worker's services, deduplicated by id, catalogue order (L5 step 1, R4.4). */
export function linkedDocuments(catalogue: CatalogueRows): Doc[] {
  const seen = new Map<string, Doc>()
  for (const c of catalogue.categories) {
    for (const l of c.documents) {
      if (!seen.has(l.document.id)) seen.set(l.document.id, { ...l.document, documentType: String(l.documentType).toUpperCase() === 'OPTIONAL' ? 'OPTIONAL' : 'REQUIRED' })
    }
  }
  for (const c of catalogue.categories) {
    for (const s of c.subcategories) for (const d of s.additionalDocuments) if (!seen.has(d.document.id)) seen.set(d.document.id, { ...d.document, documentType: 'REQUIRED' })
  }
  return [...seen.values()]
}

/** The worst status among the rows that stand for an item, or `missing` (R4.3). */
export function statusOfRows(statuses: readonly RequirementStatus[]): RequirementItemStatus {
  if (statuses.length === 0) return 'missing'
  if (statuses.includes('REJECTED')) return 'rejected'
  if (statuses.includes('EXPIRED')) return 'expired'
  if (statuses.every((s) => s === 'APPROVED')) return 'approved'
  if (statuses.some((s) => s === 'APPROVED' || s === 'SUBMITTED')) return 'submitted'
  return 'missing' // PENDING only: the row exists but nothing was handed in
}

export function requirementGroups(input: RequirementGroupsInput): RequirementGroups {
  if (input.services.length === 0) return { mandatory: [], trainings: [] } // R4.1: "choose your services first"
  const docs = linkedDocuments(input.catalogue)
  const rows = input.requirements

  const statusOf = (id: string): RequirementItemStatus => {
    if (id === CODE_OF_CONDUCT_PART1) return 'approved' // read-only step, auto-complete (R3.4)
    if (id === 'identity-points-100') {
      const primary = rows.filter((r) => r.documentCategory === 'PRIMARY').map((r) => r.status)
      const secondary = rows.filter((r) => r.documentCategory === 'SECONDARY').map((r) => r.status)
      if (primary.length === 0 || secondary.length === 0) return 'missing'
      return statusOfRows([...primary, ...secondary])
    }
    const accepted = new Set([...satisfiers(id), TRAINING_ALIASES[id] ?? id])
    const matching = rows.filter((r) => accepted.has(baseType(r.requirementType))).map((r) => r.status)
    if (id === 'abn-contractor' && matching.length === 0 && hasValidAbn(input.profile.abn)) return 'submitted' // R3.4 [fix]: the ABN itself counts
    return statusOfRows(matching)
  }

  const item = (d: Doc): RequirementItem => ({ id: d.id, name: d.name, requirementType: d.id, documentType: d.documentType, status: statusOf(d.id) })

  // R4.1: the base-compliance documents, part 1 spliced after abn-contractor (else appended), part 2 omitted.
  const mandatoryDocs = docs.filter((d) => BASE_COMPLIANCE_CATEGORIES.has(d.category) && d.id !== CODE_OF_CONDUCT_PART1 && d.id !== CODE_OF_CONDUCT_PART2)
  const part1: Doc = { id: CODE_OF_CONDUCT_PART1, name: CODE_OF_CONDUCT_PART1_NAME, category: 'COMPLIANCE', documentType: 'REQUIRED' }
  const abnIndex = mandatoryDocs.findIndex((d) => d.id === 'abn-contractor')
  if (abnIndex === -1) mandatoryDocs.push(part1)
  else mandatoryDocs.splice(abnIndex + 1, 0, part1)

  // R4.2: the trainings minus the folded modules, in the sidebar's order (a stable sort keeps unknown ids in catalogue order).
  const order = (id: string) => {
    const i = TRAINING_STEP_ORDER.indexOf(id)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  const trainingDocs = docs.filter((d) => d.category === TRAINING_CATEGORY && !FOLDED_TRAINING_IDS.has(d.id)).sort((a, b) => order(a.id) - order(b.id))

  return { mandatory: mandatoryDocs.map(item), trainings: trainingDocs.map(item) }
}
