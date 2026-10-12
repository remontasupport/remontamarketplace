// The completion flags of a worker profile (U1 worker-area, functional design R3, L3).
// Pure: rows in, Completion out. No clock, no database, no catalogue call -- the
// catalogue rows the read fetched are an input (R3.11).
//
// Today's rules are `aidlc-docs/construction/worker-area/functional-design/completion-today.md`
// (the app's getAllCompletionStatusOptimized, ported as test/worker/oracles/completion-oracle.ts).
// Where this function differs from today on purpose, the rule is marked [fix] in
// business-rules.md and the line below cites it.
import type { Completion } from '@remonta/api-contract'
import { requirementsFor } from './service-requirements'

// ---- Inputs (domain-entities.md E5) ------------------------------------------------

export interface ProfileColumns {
  firstName: string
  lastName: string
  photos: string | null
  introduction: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  age: number | null
  dateOfBirth: string | null
  gender: string | null
  hasVehicle: string | null
  languages: string[]
  /** The engagement JSON: `{ workerEngagementType: { type: 'abn' | 'tfn', signed: boolean } }`. */
  abn: unknown
}

export interface ServiceRow {
  categoryId: string
  categoryName: string
  subcategoryIds: string[]
  subcategoryNames: string[]
}

export type RequirementStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type DocumentCategory = 'PRIMARY' | 'SECONDARY' | 'WORKING_RIGHTS' | 'SERVICE_QUALIFICATION'

export interface RequirementRow {
  requirementType: string
  status: RequirementStatus
  documentCategory: DocumentCategory | null
  documentUrl: string | null
}

export interface CatalogueDoc {
  id: string
  name: string
  /** Free text in the database: IDENTITY, BUSINESS, COMPLIANCE, TRAINING, QUALIFICATION, ... */
  category: string
}

export interface CategoryLink {
  document: CatalogueDoc
  /** 'REQUIRED' or 'OPTIONAL' (free text in the database). */
  documentType: string
  conditionKey: string | null
  requiredIfTrue: boolean | null
}

export interface CatalogueCategory {
  id: string
  name: string
  documents: CategoryLink[]
  subcategories: { id: string; name: string; additionalDocuments: { document: CatalogueDoc }[] }[]
}

/** The catalogue rows the read fetched for the worker's categories and chosen sub-categories (L2 step 1g). */
export interface CatalogueRows {
  categories: CatalogueCategory[]
}

export interface AdditionalInfoRow {
  languages: string[]
  personality: string | null
}

export interface CompletionInput {
  profile: ProfileColumns
  services: ServiceRow[]
  requirements: RequirementRow[]
  catalogue: CatalogueRows
  /** The worker has a HOME worker_locations row (R3.10's "service area"). */
  hasHome: boolean
  availabilityCount: number
  experienceCount: number
  jobHistoryCount: number
  educationCount: number
  additionalInfo: AdditionalInfoRow | null
}

export type CompletionFlags = Pick<Completion, 'accountDetails' | 'compliance' | 'trainings' | 'services'>

// ---- Vocabulary -------------------------------------------------------------------

export const BASE_COMPLIANCE_CATEGORIES: ReadonlySet<string> = new Set(['IDENTITY', 'BUSINESS', 'COMPLIANCE'])
export const TRAINING_CATEGORY = 'TRAINING'
/** A row counts once it is submitted or approved; PENDING, REJECTED and EXPIRED never do (R3.5, R3.6, R3.7). */
export const COUNTING_STATUSES: ReadonlySet<RequirementStatus> = new Set(['SUBMITTED', 'APPROVED'])
export const CODE_OF_CONDUCT_PART1 = 'code-of-conduct-part1'
export const CODE_OF_CONDUCT_PART2 = 'code-of-conduct-part2'
/** The legacy name of the NDIS orientation training, accepted in both directions (R3.6). */
export const TRAINING_ALIASES: Readonly<Record<string, string>> = {
  'ndis-worker-orientation': 'ndis-training',
  'ndis-training': 'ndis-worker-orientation',
}
/** Rows always status-checked for compliance besides the required set (R3.5, today's list). */
const ALWAYS_CHECKED_TYPES: ReadonlySet<string> = new Set(['worker-screening-check', 'ndis-worker-screening', 'identity-working-rights'])
/** The sidebar's sections (R3.10). */
export const PERCENT_SECTIONS = 13

// ---- Helpers (named so the tests can cite them) -----------------------------------

/** "<Service title>:<type>" -> "<type>"; a plain type is itself. */
export function baseType(requirementType: string): string {
  const i = requirementType.lastIndexOf(':')
  return i === -1 ? requirementType : requirementType.slice(i + 1)
}

/** R3.1: whitespace-only is empty [fix]. */
export function nonEmpty(s: string | null | undefined): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

/** The engagement JSON: a signed ABN engagement counts as "a valid ABN" (R3.4 [fix], R3.10, D17). */
export function abnOf(json: unknown): { type: 'abn' | 'tfn'; signed: boolean } | null {
  const t = (json as { workerEngagementType?: { type?: unknown; signed?: unknown } } | null)?.workerEngagementType
  if (!t || (t.type !== 'abn' && t.type !== 'tfn')) return null
  return { type: t.type, signed: t.signed === true }
}

export function hasValidAbn(json: unknown): boolean {
  const a = abnOf(json)
  return a !== null && a.type === 'abn' && a.signed
}

/**
 * R3.3 [fix]: a category link is required when its documentType is REQUIRED and, if it
 * carries a condition, the profile's value for that condition is known and matches;
 * an unknown condition key is treated as not required.
 */
export function isRequiredLink(link: Pick<CategoryLink, 'documentType' | 'conditionKey' | 'requiredIfTrue'>, profile: Pick<ProfileColumns, 'hasVehicle'>): boolean {
  if (String(link.documentType).toUpperCase() !== 'REQUIRED') return false
  if (!link.conditionKey) return true
  const value = conditionValue(link.conditionKey, profile)
  if (value === undefined) return false
  return value === (link.requiredIfTrue ?? true)
}

function conditionValue(key: string, profile: Pick<ProfileColumns, 'hasVehicle'>): boolean | undefined {
  if (key === 'hasVehicle') return profile.hasVehicle === null ? undefined : profile.hasVehicle.trim().toLowerCase() === 'yes'
  return undefined
}

/** The base types that satisfy a required compliance id (R3.4); [] when presence is decided otherwise. */
export function satisfiers(requiredId: string): readonly string[] {
  switch (requiredId) {
    case 'identity-points-100':
      return []
    case 'abn-contractor':
      return ['contract-of-agreement']
    case CODE_OF_CONDUCT_PART1:
      return []
    case CODE_OF_CONDUCT_PART2:
      return ['code-of-conduct']
    case 'ndis-screening-check':
      return ['ndis-screening-check', 'worker-screening-check', 'ndis-worker-screening']
    case 'right-to-work':
      return ['right-to-work', 'identity-working-rights']
    default:
      return [requiredId]
  }
}

/** The catalogue documents of the given Document.category the worker's services call for, deduplicated, catalogue order. */
export function requiredDocumentIds(catalogue: CatalogueRows, profile: Pick<ProfileColumns, 'hasVehicle'>, accept: (category: string) => boolean): Set<string> {
  const ids = new Set<string>()
  for (const c of catalogue.categories) {
    for (const link of c.documents) if (accept(link.document.category) && isRequiredLink(link, profile)) ids.add(link.document.id)
  }
  for (const c of catalogue.categories) {
    // Sub-category documents are always required (the requirements route presents them so).
    for (const s of c.subcategories) for (const d of s.additionalDocuments) if (accept(d.document.category)) ids.add(d.document.id)
  }
  return ids
}

// ---- The flags ---------------------------------------------------------------------

/** R3.1. */
export function accountDetailsOf(p: ProfileColumns): boolean {
  return (
    nonEmpty(p.firstName) &&
    nonEmpty(p.lastName) &&
    nonEmpty(p.photos) &&
    nonEmpty(p.introduction) &&
    nonEmpty(p.city) &&
    nonEmpty(p.state) &&
    nonEmpty(p.postalCode) &&
    (p.age !== null || nonEmpty(p.dateOfBirth)) &&
    nonEmpty(p.gender)
  )
}

/** R3.2-R3.5. */
export function complianceOf(input: Pick<CompletionInput, 'profile' | 'services' | 'requirements' | 'catalogue'>): boolean {
  if (input.services.length === 0) return false
  const required = requiredDocumentIds(input.catalogue, input.profile, (c) => BASE_COMPLIANCE_CATEGORIES.has(c))
  required.add(CODE_OF_CONDUCT_PART1)
  required.add(CODE_OF_CONDUCT_PART2)

  const rows = input.requirements
  const types = new Set(rows.map((r) => baseType(r.requirementType)))
  const hasPrimary = rows.some((r) => r.documentCategory === 'PRIMARY')
  const hasSecondary = rows.some((r) => r.documentCategory === 'SECONDARY')
  const abnValid = hasValidAbn(input.profile.abn)

  const present = (id: string): boolean => {
    if (id === 'identity-points-100') return hasPrimary && hasSecondary
    if (id === CODE_OF_CONDUCT_PART1) return true
    if (id === 'abn-contractor' && abnValid) return true
    return satisfiers(id).some((t) => types.has(t))
  }
  for (const id of required) if (!present(id)) return false

  // R3.5: every row that stands for a required document must be submitted or approved
  // [fix: the rows that satisfied an alias or a composite key are checked too].
  const satisfied = new Set<string>()
  for (const id of required) for (const t of satisfiers(id)) satisfied.add(t)
  const checked = rows.filter(
    (r) =>
      required.has(r.requirementType) ||
      r.documentCategory === 'PRIMARY' ||
      r.documentCategory === 'SECONDARY' ||
      ALWAYS_CHECKED_TYPES.has(r.requirementType) ||
      satisfied.has(baseType(r.requirementType)),
  )
  return checked.length > 0 && checked.every((r) => COUNTING_STATUSES.has(r.status))
}

/** R3.6. */
export function trainingsOf(input: Pick<CompletionInput, 'profile' | 'services' | 'requirements' | 'catalogue'>): boolean {
  if (input.services.length === 0) return false
  const required = requiredDocumentIds(input.catalogue, input.profile, (c) => c === TRAINING_CATEGORY)
  if (required.size === 0) return false
  const counting = new Set(input.requirements.filter((r) => COUNTING_STATUSES.has(r.status)).map((r) => baseType(r.requirementType)))
  for (const id of required) {
    const alias = TRAINING_ALIASES[id]
    if (!counting.has(id) && !(alias !== undefined && counting.has(alias))) return false
  }
  return true
}

/** The uploaded SERVICE_QUALIFICATION types per service title, lower-cased (R3.7 [fix: case-insensitive, status checked]). */
export function serviceUploadsOf(rows: RequirementRow[]): Map<string, Set<string>> {
  const uploads = new Map<string, Set<string>>()
  for (const r of rows) {
    if (r.documentCategory !== 'SERVICE_QUALIFICATION' || !COUNTING_STATUSES.has(r.status)) continue
    const parts = r.requirementType.split(':')
    if (parts.length < 2) continue
    const title = parts[0]!.toLowerCase()
    const set = uploads.get(title) ?? new Set<string>()
    set.add(parts[parts.length - 1]!)
    uploads.set(title, set)
  }
  return uploads
}

/** R3.7: per service, the table's spec for its sub-categories against its counting uploads. */
export function servicesOf(input: Pick<CompletionInput, 'services' | 'requirements'>): boolean {
  if (input.services.length === 0) return false
  const uploads = serviceUploadsOf(input.requirements)
  return input.services.every((s) => {
    const spec = requirementsFor(s.categoryName, s.subcategoryIds)
    const uploaded = uploads.get(s.categoryName.toLowerCase()) ?? new Set<string>()
    if (spec.required.size > 0) return [...spec.required].every((t) => uploaded.has(t))
    if (spec.optional.size > 0) return uploaded.size > 0
    return true
  })
}

/** R3.10: the 13 sections of the sidebar's percentage. */
export function filledSections(input: CompletionInput): boolean[] {
  const p = input.profile
  const info = input.additionalInfo
  const languages = (info?.languages.length ? info.languages : p.languages).filter(nonEmpty)
  return [
    nonEmpty(p.firstName) && nonEmpty(p.lastName),
    nonEmpty(p.photos),
    (p.introduction ?? '').trim().length >= 50,
    input.hasHome,
    (nonEmpty(p.dateOfBirth) || p.age !== null) && nonEmpty(p.gender) && nonEmpty(p.hasVehicle) && languages.length >= 1,
    hasValidAbn(p.abn),
    input.services.length >= 1,
    input.availabilityCount >= 1,
    input.experienceCount >= 1,
    input.jobHistoryCount >= 1,
    input.educationCount >= 1,
    (info?.languages.filter(nonEmpty).length ?? 0) >= 1,
    nonEmpty(info?.personality),
  ]
}

export function percentOf(input: CompletionInput): number {
  const filled = filledSections(input).filter(Boolean).length
  return Math.round((100 * filled) / PERCENT_SECTIONS)
}

/** L3: the four flags, the overall flag (R3.8 [fix]) and the percentage. */
export function completionOf(input: CompletionInput): Completion {
  const accountDetails = accountDetailsOf(input.profile)
  const compliance = complianceOf(input)
  const trainings = trainingsOf(input)
  const services = servicesOf(input)
  return {
    accountDetails,
    compliance,
    trainings,
    services,
    profileCompleted: accountDetails && compliance && trainings && services,
    percent: percentOf(input),
  }
}

/** The persisted subset (R3.9): `worker_profiles.setupProgress`. */
export function flagsOf(c: Completion): CompletionFlags {
  return { accountDetails: c.accountDetails, compliance: c.compliance, trainings: c.trainings, services: c.services }
}
