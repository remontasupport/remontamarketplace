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
