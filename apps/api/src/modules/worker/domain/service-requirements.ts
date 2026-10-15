// The per-service document requirements as data (U1 worker-area, E4; functional design Q3 A):
// today's `apps/app/src/config/serviceDocumentRequirements.ts` (the 11 rows of
// completion-today.md) ported as a table. Matched on the lower-cased, trimmed category
// name and the hyphenated sub-category id. Whether the catalogue should drive this
// instead is U3's question; until then this table is the rule and the app's function
// is its oracle (test/worker/oracles/service-requirements-oracle.ts).
export interface ServiceSpec {
  required: ReadonlySet<string>
  optional: ReadonlySet<string>
}

export interface Spec {
  required: readonly string[]
  optional: readonly string[]
}

export interface ServiceRequirementRow {
  /** Without a sub-category (R3.7 [fix]: never short-circuited). */
  default: Spec
  /** Specific sub-categories (by hyphenated id). */
  bySubcategory?: Readonly<Record<string, Spec>>
  /** Any other sub-category; falls back to `default` when absent. */
  otherSubcategory?: Spec
}

const NONE: Spec = { required: [], optional: [] }
const AHPRA: Spec = { required: ['ahpra-registration', 'qualification-certificate'], optional: [] }
const ASSOCIATION: Spec = { required: ['professional-association-membership', 'qualification-certificate'], optional: [] }

/** Therapeutic sub-categories whose profession is AHPRA-registered. */
export const AHPRA_SUBCATEGORIES = ['occupational-therapist', 'orthoptist', 'physiotherapist', 'podiatrist', 'psychologist'] as const

export const SERVICE_REQUIREMENTS: Readonly<Record<string, ServiceRequirementRow>> = {
  'support worker': { default: { required: [], optional: ['qualification-certificate', 'other-training'] } },
  'support worker (high intensity)': {
    default: { required: ['qualification-certificate'], optional: ['manual-handling-training', 'medication-training', 'behaviour-support-training', 'other-training'] },
  },
  'cleaning services': { default: { required: [], optional: ['qualification-certificate'] } },
  'home and yard maintenance': { default: { required: [], optional: ['qualification-certificate'] } },
  'nursing services': { default: AHPRA },
  'personal trainer': { default: ASSOCIATION },
  'therapeutic supports': {
    default: { required: ['professional-association-membership', 'qualification-certificate', 'professional-indemnity-insurance'], optional: [] },
    bySubcategory: Object.fromEntries(AHPRA_SUBCATEGORIES.map((id) => [id, AHPRA])),
    otherSubcategory: ASSOCIATION,
  },
  'home modifications': { default: { required: ['qualification-certificate', 'trade-licence', 'public-liability-insurance'], optional: [] } },
  'fitness and rehabilitation': {
    default: { required: ['professional-association-membership', 'qualification-certificate', 'first-aid-cpr'], optional: ['public-liability-insurance'] },
  },
}

const key = (s: string) => s.toLowerCase().trim()

/** One service + at most one sub-category: the row's spec (the shape of today's function). */
export function specFor(categoryName: string, subcategoryId?: string): Spec {
  const row = SERVICE_REQUIREMENTS[key(categoryName)]
  if (!row) return NONE
  if (subcategoryId === undefined || subcategoryId.trim() === '') return row.default
  return row.bySubcategory?.[key(subcategoryId)] ?? row.otherSubcategory ?? row.default
}

/**
 * R3.7: the union over the chosen sub-categories (or the no-sub-category row) of the
 * required and optional types. `optional` never repeats a required type.
 */
export function requirementsFor(categoryName: string, subcategoryIds: readonly string[]): ServiceSpec {
  const required = new Set<string>()
  const optional = new Set<string>()
  const specs = subcategoryIds.length === 0 ? [specFor(categoryName)] : subcategoryIds.map((id) => specFor(categoryName, id))
  for (const s of specs) {
    for (const t of s.required) required.add(t)
    for (const t of s.optional) optional.add(t)
  }
  for (const t of required) optional.delete(t)
  return { required, optional }
}

// ---- U3b: what a worker may upload for a service, and what each document is called --------------------------------
// Ported from apps/app/src/config/serviceDocumentRequirements.ts (names, categories) and
// serviceQualificationRequirements.ts (the Cert III/IV types of the two Support Worker services), 2026-10-15.

export type DocumentKind = 'QUALIFICATION' | 'TRAINING' | 'REGISTRATION' | 'INSURANCE'

const DOCUMENT_NAMES: Readonly<Record<string, { name: string; kind: DocumentKind }>> = {
  'qualification-certificate': { name: 'Highest Relevant Qualification Certificate', kind: 'QUALIFICATION' },
  'other-training': { name: 'Other Training', kind: 'TRAINING' },
  'manual-handling-training': { name: 'Manual Handling Training', kind: 'TRAINING' },
  'medication-training': { name: 'Medication Training', kind: 'TRAINING' },
  'behaviour-support-training': { name: 'Behaviour Support Training', kind: 'TRAINING' },
  'ahpra-registration': { name: 'AHPRA Registration', kind: 'REGISTRATION' },
  'professional-association-membership': { name: 'Professional Association Membership', kind: 'REGISTRATION' },
  'professional-indemnity-insurance': { name: 'Professional Indemnity Insurance', kind: 'INSURANCE' },
  'trade-licence': { name: 'Trade Licence / Certification', kind: 'QUALIFICATION' },
  'public-liability-insurance': { name: 'Public Liability Insurance', kind: 'INSURANCE' },
  'first-aid-cpr': { name: 'First Aid & CPR Certificate', kind: 'TRAINING' },
}

/** The qualification certificate is named after the service (the app's config, per row). */
const QUALIFICATION_CERTIFICATE_NAMES: Readonly<Record<string, string>> = {
  'nursing services': 'Nursing Qualification Certificate',
  'personal trainer': 'Fitness Qualification Certificate',
  'home modifications': 'Relevant Trade Qualification Certificate',
  'fitness and rehabilitation': 'Fitness/Exercise Science Qualification',
}

const SUPPORT_WORKER_CERTIFICATES: readonly (readonly [string, string])[] = [
  ['cert3-aged-care', 'Certificate 3 Aged Care'],
  ['cert3-disabilities', 'Certificate 3 in Disabilities'],
  ['cert3-individual-support', 'Certificate 3 Individual Support'],
  ['cert3-individual-support-aged-care', 'Certificate 3 Individual Support (Aged Care)'],
  ['cert3-individual-support-disability', 'Certificate 3 Individual Support (Disability)'],
  ['cert3-home-community-care', 'Certificate 3 in Home and Community Care'],
  ['cert4-aged-care', 'Certificate 4 Aged Care'],
  ['cert4-disabilities', 'Certificate 4 in Disabilities'],
]
/** The services whose qualifications step lists named certificates (serviceQualificationRequirements.ts). */
const CERTIFICATE_SERVICES = new Set(['support worker', 'support worker (high intensity)'])

export interface UploadableDocument {
  name: string
  kind: DocumentKind
  required: boolean
}

/**
 * Every document type a worker may upload for a service with the chosen sub-categories: the requirement table's
 * required and optional types, and the named certificates where the service lists them. The answer the confirm checks
 * a requested type against (S3: today any string was accepted).
 */
export function uploadableDocuments(categoryName: string, subcategoryIds: readonly string[]): ReadonlyMap<string, UploadableDocument> {
  const k = key(categoryName)
  const spec = requirementsFor(categoryName, subcategoryIds)
  const out = new Map<string, UploadableDocument>()
  const named = (type: string) => {
    const base = DOCUMENT_NAMES[type] ?? { name: type, kind: 'QUALIFICATION' as const }
    return type === 'qualification-certificate' && QUALIFICATION_CERTIFICATE_NAMES[k] ? { ...base, name: QUALIFICATION_CERTIFICATE_NAMES[k]! } : base
  }
  for (const t of spec.required) out.set(t, { ...named(t), required: true })
  for (const t of spec.optional) out.set(t, { ...named(t), required: false })
  if (CERTIFICATE_SERVICES.has(k)) for (const [t, name] of SUPPORT_WORKER_CERTIFICATES) out.set(t, { name, kind: 'QUALIFICATION', required: false })
  return out
}
