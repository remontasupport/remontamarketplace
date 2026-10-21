// fast-check arbitraries for the worker area (U1 worker-area, PBT-01, NFR pattern P9):
// profiles, services, requirement rows and catalogue rows in the shapes the staging
// copy holds (probed 2026-10-12: the six categories, the 26 catalogue documents, the
// requirement types the app writes), plus `fixCasesOf`, the classifier of R3.12's
// partition: which [fix] rules a generated profile exercises, so the property test
// knows where today's function and the new one are allowed to disagree. Exported for
// U2-U4.
import fc from 'fast-check'
import {
  baseType,
  COUNTING_STATUSES,
  hasValidAbn,
  nonEmpty,
  TRAINING_ALIASES,
  type CatalogueCategory,
  type CatalogueRows,
  type CompletionInput,
  type ProfileColumns,
  type RequirementRow,
  type RequirementStatus,
  type ServiceRow,
} from '../../src/modules/worker/domain/completion'

// ---- Vocabulary (the staging copy, 2026-10-12) -------------------------------------

export const CATEGORIES: readonly { id: string; name: string }[] = [
  { id: 'support-worker', name: 'Support Worker' },
  { id: 'support-worker-high-intensity', name: 'Support Worker (High Intensity)' },
  { id: 'cleaning-services', name: 'Cleaning Services' },
  { id: 'home-yard-maintenance', name: 'Home and Yard Maintenance' },
  { id: 'nursing-services', name: 'Nursing Services' },
  { id: 'therapeutic-supports', name: 'Therapeutic Supports' },
  // In the services table but not in the catalogue:
  { id: 'personal-trainer', name: 'Personal Trainer' },
  { id: 'fitness-and-rehabilitation', name: 'Fitness and Rehabilitation' },
]

/** Sub-category names whose slug (lower-cased, spaces to hyphens) is their id, as today's functions assume. */
export const SUBCATEGORIES: readonly { id: string; name: string }[] = [
  { id: 'personal-care', name: 'Personal Care' },
  { id: 'domestic-tasks', name: 'Domestic Tasks' },
  { id: 'occupational-therapist', name: 'Occupational Therapist' },
  { id: 'physiotherapist', name: 'Physiotherapist' },
  { id: 'psychologist', name: 'Psychologist' },
  { id: 'dietitian', name: 'Dietitian' },
  { id: 'speech-pathologist', name: 'Speech Pathologist' },
]

export const DOCUMENTS: readonly { id: string; name: string; category: string }[] = [
  { id: 'abn-contractor', name: 'Worker Engagement Type', category: 'BUSINESS' },
  { id: 'ndis-screening-check', name: 'NDIS Worker Screening Check', category: 'COMPLIANCE' },
  { id: 'police-check', name: 'Police Check', category: 'COMPLIANCE' },
  { id: 'working-with-children', name: 'Working With Children Check', category: 'COMPLIANCE' },
  { id: 'identity-points-100', name: 'ID verification', category: 'IDENTITY' },
  { id: 'right-to-work', name: 'Right to Work Documents', category: 'IDENTITY' },
  { id: 'public-liability-10m', name: 'Public Liability Insurance (min $10M)', category: 'INSURANCE' },
  { id: 'qualification-certificate', name: 'Highest Relevant Qualification Certificate', category: 'QUALIFICATION' },
  { id: 'resume-evidence', name: 'Resume / Experience Evidence', category: 'QUALIFICATION' },
  { id: 'ahpra-registration', name: 'AHPRA Registration', category: 'REGISTRATION' },
  { id: 'behaviour-support', name: 'Behaviour Support Training', category: 'TRAINING' },
  { id: 'cpr', name: 'CPR', category: 'TRAINING' },
  { id: 'effective-communication', name: 'Supporting Effective Communication', category: 'TRAINING' },
  { id: 'first-aid-cpr', name: 'First Aid', category: 'TRAINING' },
  { id: 'infection-control', name: 'Infection Control Training', category: 'TRAINING' },
  { id: 'manual-handling', name: 'Manual Handling Training', category: 'TRAINING' },
  { id: 'medication-training', name: 'Medication Training', category: 'TRAINING' },
  { id: 'ndis-induction-module', name: 'New Worker NDIS Induction Module', category: 'TRAINING' },
  { id: 'ndis-worker-orientation', name: 'NDIS Worker Orientation Modules', category: 'TRAINING' },
  { id: 'safe-enjoyable-meals', name: 'Supporting Safe and Enjoyable Meals', category: 'TRAINING' },
  { id: 'drivers-licence', name: "Driver's Licence", category: 'TRANSPORT' },
]
export const TRAINING_IDS = DOCUMENTS.filter((d) => d.category === 'TRAINING').map((d) => d.id)

/** Plain requirement types the app writes, with the document category it gives them. */
export const PLAIN_REQUIREMENT_TYPES: readonly { type: string; category: RequirementRow['documentCategory'] }[] = [
  { type: 'contract-of-agreement', category: null },
  { type: 'identity-passport', category: 'PRIMARY' },
  { type: 'identity-birth-certificate', category: 'PRIMARY' },
  { type: 'code-of-conduct', category: null },
  { type: 'driver-license-vehicle', category: 'SECONDARY' },
  { type: 'identity-drivers-license', category: 'SECONDARY' },
  { type: 'identity-working-rights', category: 'WORKING_RIGHTS' },
  { type: 'right-to-work', category: null },
  { type: 'police-check', category: null },
  { type: 'worker-screening-check', category: null },
  { type: 'ndis-worker-screening', category: null },
  { type: 'ndis-screening-check', category: null },
  { type: 'working-with-children', category: null },
  { type: 'ndis-training', category: null },
  ...TRAINING_IDS.map((type) => ({ type, category: null as RequirementRow['documentCategory'] })),
]

export const SERVICE_DOC_TYPES = [
  'qualification-certificate',
  'other-training',
  'manual-handling-training',
  'medication-training',
  'behaviour-support-training',
  'ahpra-registration',
  'professional-association-membership',
  'professional-indemnity-insurance',
  'trade-licence',
  'public-liability-insurance',
  'first-aid-cpr',
  'cert3-individual-support',
] as const

export const STATUSES: readonly RequirementStatus[] = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED']

// ---- Arbitraries ---------------------------------------------------------------------

const maybe = <T>(arb: fc.Arbitrary<T>, nil: T, p = 0.3) => fc.oneof({ weight: Math.round(p * 10), arbitrary: fc.constant(nil) }, { weight: 10 - Math.round(p * 10), arbitrary: arb })
/** A text column: a word, empty, whitespace-only (R3.1's case) or null. */
const text = (nil = true) => fc.oneof({ weight: 30, arbitrary: fc.constantFrom('Mary', 'Jo', 'x', 'Parramatta', 'NSW', '2150') }, { weight: 4, arbitrary: fc.constant('') }, { weight: 1, arbitrary: fc.constantFrom(' ', '\t', '  ') }, { weight: nil ? 8 : 0, arbitrary: fc.constant(null) })
const bio = fc.oneof(fc.constant(null), fc.constant(''), fc.constant('   '), fc.constant('short'), fc.constant('a'.repeat(50)), fc.constant('b'.repeat(120)))

export const abnJson: fc.Arbitrary<unknown> = fc.oneof(
  { weight: 10, arbitrary: fc.constant(null) },
  { weight: 4, arbitrary: fc.constant({ workerEngagementType: { type: 'abn', signed: true } }) },
  { weight: 2, arbitrary: fc.constant({ workerEngagementType: { type: 'abn', signed: false } }) },
  { weight: 4, arbitrary: fc.constant({ workerEngagementType: { type: 'tfn', signed: true } }) },
  { weight: 1, arbitrary: fc.constant({ workerEngagementType: { type: 'abn', value: '92365331309' } }) },
  { weight: 1, arbitrary: fc.constant({ workerEngagementType: { type: 'tfn', value: '883636086' } }) },
  { weight: 1, arbitrary: fc.constant({ something: 'else' }) },
)

export const profileColumns: fc.Arbitrary<ProfileColumns> = fc.record({
  firstName: text(false).map((s) => s ?? ''),
  lastName: text(false).map((s) => s ?? ''),
  photos: maybe(fc.constantFrom('https://blob.test/p.jpg', ' '), null),
  introduction: bio,
  city: text(),
  state: text(),
  postalCode: text(),
  age: maybe(fc.integer({ min: 18, max: 80 }), null),
  dateOfBirth: maybe(fc.constantFrom('1990-01-01', '1985-07-15', ' '), null, 0.8),
  gender: maybe(fc.constantFrom('Male', 'Female', ' '), null),
  hasVehicle: fc.constantFrom('Yes', 'No', null),
  languages: fc.array(fc.constantFrom('English', 'Hindi', 'Arabic', ' '), { maxLength: 3 }),
  abn: abnJson,
})

export const serviceRow: fc.Arbitrary<ServiceRow> = fc
  .record({
    category: fc.constantFrom(...CATEGORIES),
    subs: fc.oneof({ weight: 1, arbitrary: fc.constant([] as { id: string; name: string }[]) }, { weight: 9, arbitrary: fc.uniqueArray(fc.constantFrom(...SUBCATEGORIES), { minLength: 1, maxLength: 3, selector: (s) => s.id }) }),
  })
  .map(({ category, subs }) => ({ categoryId: category.id, categoryName: category.name, subcategoryIds: subs.map((s) => s.id), subcategoryNames: subs.map((s) => s.name) }))

/** Mostly the states the app leaves behind: submitted/approved with a url, pending without one. */
const statusAndUrl = fc.oneof(
  { weight: 7, arbitrary: fc.constantFrom('SUBMITTED', 'APPROVED').map((status) => ({ status: status as RequirementStatus, url: true })) },
  { weight: 2, arbitrary: fc.constant({ status: 'PENDING' as RequirementStatus, url: false }) },
  { weight: 1, arbitrary: fc.record({ status: fc.constantFrom(...STATUSES), url: fc.boolean() }) },
)
const sometimes = (p: number) => fc.oneof({ weight: Math.round(p * 20), arbitrary: fc.constant(true) }, { weight: 20 - Math.round(p * 20), arbitrary: fc.constant(false) })

/** A SERVICE_QUALIFICATION row keyed "<Title>:<type>", the title sometimes in another case (R3.7's case-insensitive fix). */
const serviceQualificationRow = (titles: string[]): fc.Arbitrary<RequirementRow> =>
  fc
    .record({
      title: fc.constantFrom(...(titles.length ? titles : ['Support Worker'])),
      lower: sometimes(0.1),
      type: fc.constantFrom(...SERVICE_DOC_TYPES),
      su: statusAndUrl,
    })
    .map((r) => ({ requirementType: `${r.lower ? r.title.toLowerCase() : r.title}:${r.type}`, status: r.su.status, documentCategory: 'SERVICE_QUALIFICATION' as const, documentUrl: r.su.url ? 'https://blob.test/d.pdf' : null }))

const plainRow: fc.Arbitrary<RequirementRow> = fc
  .record({ t: fc.constantFrom(...PLAIN_REQUIREMENT_TYPES), su: statusAndUrl, composite: sometimes(0.1) })
  .map((r) => ({ requirementType: r.composite ? `Support Worker:${r.t.type}` : r.t.type, status: r.su.status, documentCategory: r.t.category, documentUrl: r.su.url ? 'https://blob.test/d.pdf' : null }))

export const requirementRows = (services: ServiceRow[]): fc.Arbitrary<RequirementRow[]> =>
  fc.array(fc.oneof({ weight: 4, arbitrary: plainRow }, { weight: 1, arbitrary: serviceQualificationRow(services.map((s) => s.categoryName)) }), { maxLength: 14 })

const categoryLink = fc.record({
  document: fc.constantFrom(...DOCUMENTS),
  documentType: fc.oneof({ weight: 30, arbitrary: fc.constant('REQUIRED') }, { weight: 1, arbitrary: fc.constant('OPTIONAL') }),
  conditionKey: fc.oneof({ weight: 30, arbitrary: fc.constant(null) }, { weight: 1, arbitrary: fc.constantFrom('hasVehicle', 'unknownKey') }),
  requiredIfTrue: fc.constantFrom(null, true, false),
})

/** The catalogue rows the read would fetch for these services: the matched categories, their links and the chosen sub-categories' documents. */
export const catalogueRows = (services: ServiceRow[]): fc.Arbitrary<CatalogueRows> => {
  const inCatalogue = services.filter((s) => CATEGORIES.slice(0, 6).some((c) => c.id === s.categoryId))
  if (inCatalogue.length === 0) return fc.constant({ categories: [] })
  return fc
    .tuple(
      ...inCatalogue.map((s) =>
        fc.record({
          documents: fc.uniqueArray(categoryLink, { maxLength: 8, selector: (l) => l.document.id }),
          subDocs: fc.array(fc.uniqueArray(fc.constantFrom(...DOCUMENTS), { maxLength: 2, selector: (d) => d.id }), { minLength: s.subcategoryIds.length, maxLength: s.subcategoryIds.length }),
        }).map(
          (c): CatalogueCategory => ({
            id: s.categoryId,
            name: s.categoryName,
            documents: c.documents,
            subcategories: s.subcategoryIds.map((id, i) => ({ id, name: s.subcategoryNames[i]!, additionalDocuments: (c.subDocs[i] ?? []).map((document) => ({ document })) })),
          }),
        ),
      ),
    )
    .map((categories) => ({ categories }))
}

export const completionInput: fc.Arbitrary<CompletionInput> = fc
  .record({
    profile: profileColumns,
    services: fc.uniqueArray(serviceRow, { maxLength: 3, selector: (s) => s.categoryId }),
  })
  .chain(({ profile, services }) =>
    fc.record({
      profile: fc.constant(profile),
      services: fc.constant(services),
      requirements: requirementRows(services),
      catalogue: catalogueRows(services),
      hasHome: fc.boolean(),
      availabilityCount: fc.integer({ min: 0, max: 3 }),
      experienceCount: fc.integer({ min: 0, max: 3 }),
      jobHistoryCount: fc.integer({ min: 0, max: 3 }),
      educationCount: fc.integer({ min: 0, max: 3 }),
      additionalInfo: maybe(fc.record({ languages: fc.array(fc.constantFrom('English', 'Hindi', ' '), { maxLength: 2 }), personality: maybe(fc.constantFrom('calm', ' '), null) }), null),
    }),
  )

// ---- The partition (R3.12) --------------------------------------------------------------

export type FixCase =
  | 'whitespace' // R3.1: a whitespace-only account column; or dateOfBirth without age
  | 'link-optional-or-conditional' // R3.3, R3.6: an OPTIONAL or conditional category link
  | 'abn-counts' // R3.4: a valid ABN with no contract-of-agreement row
  | 'status-compliance' // R3.5: a composite or contract/code-of-conduct row that is not SUBMITTED/APPROVED
  | 'trainings-status' // R3.6: a training row whose status and documentUrl disagree
  | 'no-offerings' // R3.7: a service without sub-categories
  | 'service-title-case' // R3.7: a SERVICE_QUALIFICATION key whose title differs from the service's in case only
  | 'service-status' // R3.7: a SERVICE_QUALIFICATION row whose status and documentUrl disagree

/** Which [fix] rules this input exercises; empty = today's function must agree exactly. */
export function fixCasesOf(input: CompletionInput): FixCase[] {
  const hits = new Set<FixCase>()
  const p = input.profile
  const columns = [p.firstName, p.lastName, p.photos, p.introduction, p.city, p.state, p.postalCode, p.gender]
  if (columns.some((c) => typeof c === 'string' && c.length > 0 && !nonEmpty(c))) hits.add('whitespace')
  if (p.age === null && nonEmpty(p.dateOfBirth)) hits.add('whitespace')

  const relevant = (category: string) => ['IDENTITY', 'BUSINESS', 'COMPLIANCE', 'TRAINING'].includes(category)
  for (const c of input.catalogue.categories) {
    for (const l of c.documents) if (relevant(l.document.category) && (l.documentType !== 'REQUIRED' || l.conditionKey !== null)) hits.add('link-optional-or-conditional')
  }

  const types = new Set(input.requirements.map((r) => baseType(r.requirementType)))
  if (input.services.length > 0 && hasValidAbn(p.abn) && !types.has('contract-of-agreement')) hits.add('abn-counts')

  // The rows today's step 4 status-checks: full type among the linked base ids (any documentType), PRIMARY/SECONDARY, or the three always-checked types.
  const oracleBaseIds = new Set<string>(['code-of-conduct-part1', 'code-of-conduct-part2'])
  for (const c of input.catalogue.categories) {
    for (const l of c.documents) if (['IDENTITY', 'BUSINESS', 'COMPLIANCE'].includes(l.document.category)) oracleBaseIds.add(l.document.id)
    for (const sc of c.subcategories) for (const d of sc.additionalDocuments) if (['IDENTITY', 'BUSINESS', 'COMPLIANCE'].includes(d.document.category)) oracleBaseIds.add(d.document.id)
  }
  const oracleChecksSomething = input.requirements.some((r) => oracleBaseIds.has(r.requirementType) || r.documentCategory === 'PRIMARY' || r.documentCategory === 'SECONDARY' || ['worker-screening-check', 'ndis-worker-screening', 'identity-working-rights'].includes(r.requirementType))

  const trainingTypes = new Set([...TRAINING_IDS, ...Object.values(TRAINING_ALIASES)])
  for (const r of input.requirements) {
    const base = baseType(r.requirementType)
    const ok = COUNTING_STATUSES.has(r.status)
    // R3.6: today every row whose base type is a training -- a PENDING duplicate, and a SERVICE_QUALIFICATION row
    // keyed `<Service>:<training id>` too (today's filter is by base type, not category) -- must carry a url, and a
    // row counts by url not status; the fix counts training rows by status alone, so any such row that is not
    // (counting with a url) may differ. Checked before the SERVICE_QUALIFICATION branch below, which skips the rest.
    if (trainingTypes.has(base) && (!ok || !r.documentUrl)) hits.add('trainings-status')
    if (r.documentCategory === 'SERVICE_QUALIFICATION') {
      if (ok !== !!r.documentUrl) hits.add('service-status')
      const title = r.requirementType.split(':')[0]!
      if (input.services.some((s) => s.categoryName !== title && s.categoryName.toLowerCase() === title.toLowerCase())) hits.add('service-title-case')
      continue
    }
    // R3.5: a row today never checked (composite, contract, code of conduct) is checked now: it can fail the check, or be the one row that makes the check non-empty.
    const newlyChecked = r.requirementType.includes(':') || base === 'contract-of-agreement' || base === 'code-of-conduct'
    if (newlyChecked && (!ok || !oracleChecksSomething)) hits.add('status-compliance')
  }
  if (input.services.some((s) => s.subcategoryNames.length === 0)) hits.add('no-offerings')
  return [...hits]
}

/** An input with every one of the 13 sections filled (R3.10). */
export function fullyFilledInput(base: CompletionInput): CompletionInput {
  return {
    ...base,
    profile: { ...base.profile, firstName: 'Mary', lastName: 'Lee', photos: 'https://blob.test/p.jpg', introduction: 'x'.repeat(60), dateOfBirth: '1990-01-01', age: null, gender: 'Female', hasVehicle: 'Yes', languages: ['English'], abn: { workerEngagementType: { type: 'abn', signed: true } } },
    services: base.services.length ? base.services : [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: ['personal-care'], subcategoryNames: ['Personal Care'] }],
    hasHome: true,
    availabilityCount: 1,
    experienceCount: 1,
    jobHistoryCount: 1,
    educationCount: 1,
    additionalInfo: { languages: ['English'], personality: 'calm' },
  }
}
