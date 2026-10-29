// The completion flags (U1 worker-area): P2 the oracle partition, P3 the percentage,
// E4 the services table against today's function, and one case per [fix] rule.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  accountDetailsOf,
  completionOf,
  complianceOf,
  flagsOf,
  hasValidAbn,
  percentOf,
  servicesOf,
  trainingsOf,
  type CompletionInput,
  type RequirementRow,
} from '../../src/modules/worker/domain/completion'
import { AHPRA_SUBCATEGORIES, requirementsFor, SERVICE_REQUIREMENTS, specFor } from '../../src/modules/worker/domain/service-requirements'
import { CATEGORIES, completionInput, DOCUMENTS, fixCasesOf, fullyFilledInput, SUBCATEGORIES, type FixCase } from './generators'
import { completionOracle } from './oracles/completion-oracle'
import { getServiceDocumentRequirements } from './oracles/service-requirements-oracle'

describe('P2: completionOf against today\'s function (R3.12)', () => {
  it('agrees with the oracle on every generated profile outside the [fix] cases, and both partitions are exercised', () => {
    const seen = { plain: 0, fixed: 0 }
    fc.assert(
      fc.property(completionInput, (input) => {
        const fixes = fixCasesOf(input)
        const got = completionOf(input)
        const expected = completionOracle(input)
        if (fixes.length === 0) {
          seen.plain++
          expect(expected).not.toBe(false)
          expect(flagsOf(got)).toEqual(expected)
        } else {
          seen.fixed++
          // The three flags the no-offerings early return threw away still agree when that is the only difference.
          if (fixes.length === 1 && fixes[0] === 'no-offerings') {
            const variant = completionOracle({ ...input, services: input.services.map((s) => (s.subcategoryNames.length ? s : { ...s, subcategoryNames: ['x'], subcategoryIds: ['x'] })) })
            expect(variant).not.toBe(false)
            const v = variant as Exclude<typeof variant, false>
            expect([got.accountDetails, got.compliance, got.trainings]).toEqual([v.accountDetails, v.compliance, v.trainings])
          }
        }
        expect(got.profileCompleted).toBe(got.accountDetails && got.compliance && got.trainings && got.services)
      }),
      { numRuns: Number(process.env.FC_RUNS ?? 600) },
    )
    // Both partitions are exercised on every run; how large they are is measured on the fixed seed below.
    expect(seen.plain).toBeGreaterThan(0)
    expect(seen.fixed).toBeGreaterThan(0)
  }, 30_000)

  // The partitions' sizes depend on the random draw (49 of 600 on one CI run, 2026-10-15), so they are measured on a
  // fixed-seed sample of the same size: deterministic, and the same generator.
  it('both partitions are large (fixed seed, 600 inputs)', () => {
    let plain = 0
    let fixed = 0
    for (const input of fc.sample(completionInput, { numRuns: 600, seed: 20261015 })) (fixCasesOf(input).length === 0 ? plain++ : fixed++)
    expect(plain).toBeGreaterThan(50)
    expect(fixed).toBeGreaterThan(50)
  })

  // Coverage of the partition (R3.12: every [fix] kind must be exercised) is measured on a fixed-seed sample large
  // enough for the rarest kind, so it is deterministic; the equality above stays random on every run.
  it('the generator exercises every [fix] kind (fixed seed, 5,000 inputs)', () => {
    const counts = new Map<FixCase, number>()
    let plain = 0
    for (const input of fc.sample(completionInput, { numRuns: 5000, seed: 20261012 })) {
      const fixes = fixCasesOf(input)
      if (fixes.length === 0) plain++
      for (const k of fixes) counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    // Both partitions are large: the equality is tested on many plain inputs, the fixes on many fixed ones.
    // 494 plain on this sample since the R3.6 detector also sees SERVICE_QUALIFICATION rows named after a training (2026-10-12).
    expect(plain).toBeGreaterThan(400)
    expect(5000 - plain).toBeGreaterThan(500)
    for (const k of ['whitespace', 'link-optional-or-conditional', 'abn-counts', 'status-compliance', 'trainings-status', 'no-offerings', 'service-title-case', 'service-status'] as FixCase[]) {
      expect(counts.get(k) ?? 0, k).toBeGreaterThan(5)
    }
  })
})

// CI 2026-10-12 (seed -647976850): a SERVICE_QUALIFICATION row keyed `<Service>:<training id>`, PENDING with no file,
// beside a SUBMITTED training row. Today's function counts it as a training row and needs its url (false); the fix
// counts the submitted training (true). The partition must call this an R3.6 case, not a plain one.
it('R3.6 regression: a pending service-qualification row named after a training is a [fix] case, and the training counts', () => {
  const input = fc.sample(completionInput, { numRuns: 1, seed: 1 })[0]!
  const training = 'medication-training'
  const shaped: CompletionInput = {
    ...input,
    services: [{ categoryId: 'cleaning-services', categoryName: 'Cleaning Services', subcategoryIds: ['dietitian'], subcategoryNames: ['Dietitian'] }],
    requirements: [
      { requirementType: training, status: 'SUBMITTED', documentCategory: null, documentUrl: 'https://blob.test/d.pdf' },
      { requirementType: `Personal Trainer:${training}`, status: 'PENDING', documentCategory: 'SERVICE_QUALIFICATION', documentUrl: null },
    ],
    catalogue: {
      categories: [
        {
          id: 'cleaning-services',
          name: 'Cleaning Services',
          documents: [{ document: { id: training, name: 'Medication Training', category: 'TRAINING' }, documentType: 'REQUIRED', conditionKey: null, requiredIfTrue: null }],
          subcategories: [{ id: 'dietitian', name: 'Dietitian', additionalDocuments: [] }],
        },
      ],
    },
  } as CompletionInput
  expect(fixCasesOf(shaped)).toContain('trainings-status')
  expect(trainingsOf(shaped)).toBe(true)
  expect((completionOracle(shaped) as { trainings: boolean }).trainings).toBe(false)
})

describe('P3: the percentage (R3.10)', () => {
  it('is an integer in [0, 100], never lowered by filling a section, and 100 with all thirteen filled', () => {
    fc.assert(
      fc.property(completionInput, fc.integer({ min: 0, max: 12 }), (input, which) => {
        const before = percentOf(input)
        expect(Number.isInteger(before)).toBe(true)
        expect(before).toBeGreaterThanOrEqual(0)
        expect(before).toBeLessThanOrEqual(100)
        const filled = fillOne(input, which)
        expect(percentOf(filled)).toBeGreaterThanOrEqual(before)
        expect(percentOf(fullyFilledInput(input))).toBe(100)
      }),
      { numRuns: Number(process.env.FC_RUNS ?? 300) },
    )
  }, 30_000)

  it('is the sidebar formula: round(100 × filled / 13)', () => {
    const empty: CompletionInput = { profile: { firstName: '', lastName: '', photos: null, introduction: null, age: null, dateOfBirth: null, gender: null, hasVehicle: null, languages: [], abn: null }, services: [], requirements: [], catalogue: { categories: [] }, hasHome: false, availabilityCount: 0, experienceCount: 0, jobHistoryCount: 0, educationCount: 0, additionalInfo: null }
    expect(percentOf(empty)).toBe(0)
    expect(percentOf({ ...empty, hasHome: true })).toBe(8) // 1/13
    expect(percentOf({ ...empty, hasHome: true, availabilityCount: 1, experienceCount: 1 })).toBe(23) // 3/13
  })
})

function fillOne(input: CompletionInput, which: number): CompletionInput {
  const p = input.profile
  switch (which) {
    case 0: return { ...input, profile: { ...p, firstName: 'Mary', lastName: 'Lee' } }
    case 1: return { ...input, profile: { ...p, photos: 'https://blob.test/p.jpg' } }
    case 2: return { ...input, profile: { ...p, introduction: 'y'.repeat(50) } }
    case 3: return { ...input, hasHome: true }
    case 4: return { ...input, profile: { ...p, age: 30, gender: 'Male', hasVehicle: 'No', languages: ['English'] } }
    case 5: return { ...input, profile: { ...p, abn: { workerEngagementType: { type: 'abn', signed: true } } } }
    case 6: return { ...input, services: input.services.length ? input.services : [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: [], subcategoryNames: [] }] }
    case 7: return { ...input, availabilityCount: 1 }
    case 8: return { ...input, experienceCount: 1 }
    case 9: return { ...input, jobHistoryCount: 1 }
    case 10: return { ...input, educationCount: 1 }
    case 11: return { ...input, additionalInfo: { languages: ['English'], personality: input.additionalInfo?.personality ?? null } }
    default: return { ...input, additionalInfo: { languages: input.additionalInfo?.languages ?? [], personality: 'calm' } }
  }
}

describe('E4: the services table equals today\'s function', () => {
  const names = [...CATEGORIES.map((c) => c.name), 'Personal Trainer', 'Home Modifications', 'Fitness and Rehabilitation', 'Unknown Service', ' support worker ']
  const subs = [undefined, ...SUBCATEGORIES.map((s) => s.id), ...AHPRA_SUBCATEGORIES, 'orthoptist', 'podiatrist', 'nothing-known']

  it('for every known service and sub-category id, required and optional match the oracle', () => {
    for (const name of names) {
      for (const sub of subs) {
        const oracle = getServiceDocumentRequirements(name, sub)
        const spec = specFor(name, sub)
        expect([...spec.required].sort(), `${name} / ${sub} required`).toEqual(oracle.filter((r) => r.required).map((r) => r.type).sort())
        expect([...spec.optional].sort(), `${name} / ${sub} optional`).toEqual(oracle.filter((r) => !r.required).map((r) => r.type).sort())
      }
    }
    expect(Object.keys(SERVICE_REQUIREMENTS)).toHaveLength(9) // the 11 rows: therapeutic supports holds three
  })

  it('unions the chosen sub-categories as the oracle does, with no type both required and optional', () => {
    const r = requirementsFor('Therapeutic Supports', ['occupational-therapist', 'dietitian'])
    expect([...r.required].sort()).toEqual(['ahpra-registration', 'professional-association-membership', 'qualification-certificate'])
    expect(r.optional.size).toBe(0)
    const fr = requirementsFor('Fitness and Rehabilitation', [])
    expect([...fr.optional]).toEqual(['public-liability-insurance'])
  })
})

// ---- One case per [fix] rule ---------------------------------------------------------

const base = (): CompletionInput => ({
  profile: { firstName: 'Mary', lastName: 'Lee', photos: 'https://blob.test/p.jpg', introduction: 'hello', age: 30, dateOfBirth: null, gender: 'Female', hasVehicle: 'Yes', languages: ['English'], abn: null },
  services: [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: ['personal-care'], subcategoryNames: ['Personal Care'] }],
  requirements: [],
  catalogue: { categories: [] },
  hasHome: true,
  availabilityCount: 1,
  experienceCount: 1,
  jobHistoryCount: 1,
  educationCount: 1,
  additionalInfo: null,
})
const doc = (id: string) => DOCUMENTS.find((d) => d.id === id)!
const link = (id: string, documentType = 'REQUIRED', conditionKey: string | null = null, requiredIfTrue: boolean | null = null) => ({ document: doc(id), documentType, conditionKey, requiredIfTrue })
const row = (requirementType: string, status: RequirementRow['status'] = 'SUBMITTED', documentCategory: RequirementRow['documentCategory'] = null, documentUrl: string | null = 'https://blob.test/d.pdf'): RequirementRow => ({ requirementType, status, documentCategory, documentUrl })

describe('the [fix] rules', () => {
  it('R3.1: whitespace-only is empty; a date of birth counts like an age; the location is the HOME row (FR-8r)', () => {
    expect(accountDetailsOf(base().profile, true)).toBe(true)
    expect(accountDetailsOf(base().profile, false)).toBe(false)
    expect(accountDetailsOf({ ...base().profile, gender: '   ' }, true)).toBe(false)
    expect(accountDetailsOf({ ...base().profile, age: null, dateOfBirth: '1990-01-01' }, true)).toBe(true)
    expect(accountDetailsOf({ ...base().profile, age: null, dateOfBirth: ' ' }, true)).toBe(false)
  })

  it('R3.3: an OPTIONAL category link is not required; a condition is honoured when known and ignored otherwise', () => {
    const input = base()
    input.catalogue = { categories: [{ id: 'support-worker', name: 'Support Worker', documents: [link('police-check', 'OPTIONAL'), link('working-with-children', 'REQUIRED', 'hasVehicle', true), link('right-to-work', 'REQUIRED', 'unknownKey', true)], subcategories: [] }] }
    input.requirements = [row('code-of-conduct')]
    // Only code-of-conduct-part2 (always) and, with hasVehicle Yes, working-with-children are required.
    expect(complianceOf(input)).toBe(false)
    input.requirements.push(row('working-with-children'))
    expect(complianceOf(input)).toBe(true)
    input.profile.hasVehicle = 'No'
    expect(complianceOf({ ...input, requirements: [row('code-of-conduct')] })).toBe(true)
    input.profile.hasVehicle = null
    expect(complianceOf({ ...input, requirements: [row('code-of-conduct')] })).toBe(true)
  })

  it('R3.4: a signed ABN engagement satisfies abn-contractor without a contract row; an 11-digit value does too', () => {
    const input = base()
    input.catalogue = { categories: [{ id: 'support-worker', name: 'Support Worker', documents: [link('abn-contractor')], subcategories: [] }] }
    input.requirements = [row('code-of-conduct')]
    expect(complianceOf(input)).toBe(false)
    input.profile.abn = { workerEngagementType: { type: 'abn', signed: true } }
    expect(complianceOf(input)).toBe(true)
    expect(hasValidAbn({ workerEngagementType: { type: 'abn', value: '92365331309' } })).toBe(true)
    expect(hasValidAbn({ workerEngagementType: { type: 'tfn', signed: true } })).toBe(false)
    expect(hasValidAbn({ workerEngagementType: { type: 'abn', signed: false } })).toBe(false)
  })

  it('R3.5: the rows that satisfy an alias or a composite key are status-checked too', () => {
    const input = base()
    input.catalogue = { categories: [{ id: 'support-worker', name: 'Support Worker', documents: [link('police-check')], subcategories: [] }] }
    input.requirements = [row('Support Worker:police-check', 'REJECTED'), row('code-of-conduct', 'SUBMITTED')]
    expect(complianceOf(input)).toBe(false)
    input.requirements = [row('Support Worker:police-check', 'APPROVED'), row('code-of-conduct', 'REJECTED')]
    expect(complianceOf(input)).toBe(false)
    input.requirements = [row('Support Worker:police-check', 'APPROVED'), row('code-of-conduct', 'SUBMITTED')]
    expect(complianceOf(input)).toBe(true)
  })

  it('R3.6: a training counts by status, not by documentUrl; the orientation alias holds both ways', () => {
    const input = base()
    input.catalogue = { categories: [{ id: 'support-worker', name: 'Support Worker', documents: [link('ndis-worker-orientation'), link('cpr')], subcategories: [] }] }
    input.requirements = [row('ndis-training', 'APPROVED', null, null), row('cpr', 'REJECTED', null, 'https://blob.test/x.pdf')]
    expect(trainingsOf(input)).toBe(false)
    input.requirements = [row('ndis-training', 'APPROVED', null, null), row('cpr', 'SUBMITTED', null, null)]
    expect(trainingsOf(input)).toBe(true)
    expect(trainingsOf({ ...input, catalogue: { categories: [] } })).toBe(false) // no training required -> false, as today
  })

  it('R3.7: a service without sub-categories is evaluated with the "no subcategory" row; titles match case-insensitively; status, not url', () => {
    const noSubs = base()
    noSubs.services = [{ categoryId: 'therapeutic-supports', categoryName: 'Therapeutic Supports', subcategoryIds: [], subcategoryNames: [] }]
    expect(servicesOf(noSubs)).toBe(false)
    noSubs.requirements = ['professional-association-membership', 'qualification-certificate', 'professional-indemnity-insurance'].map((t) => row(`therapeutic supports:${t}`, 'SUBMITTED', 'SERVICE_QUALIFICATION', null))
    expect(servicesOf(noSubs)).toBe(true)
    expect(completionOracle(noSubs)).toBe(false) // what today's callers saw: every flag false
    const rejected = base()
    rejected.services = [{ categoryId: 'nursing-services', categoryName: 'Nursing Services', subcategoryIds: ['x'], subcategoryNames: ['X'] }]
    rejected.requirements = [row('Nursing Services:ahpra-registration', 'REJECTED', 'SERVICE_QUALIFICATION'), row('Nursing Services:qualification-certificate', 'APPROVED', 'SERVICE_QUALIFICATION')]
    expect(servicesOf(rejected)).toBe(false)
    // optional-only service: at least one counting upload
    const sw = base()
    expect(servicesOf(sw)).toBe(false)
    sw.requirements = [row('Support Worker:other-training', 'SUBMITTED', 'SERVICE_QUALIFICATION', null)]
    expect(servicesOf(sw)).toBe(true)
  })

  it('R3.8: profileCompleted is the conjunction; R3.11: the function is pure (same input, same output)', () => {
    const input = fullyFilledInput(base())
    const a = completionOf(input)
    const b = completionOf(structuredClone(input))
    expect(a).toEqual(b)
    expect(a.profileCompleted).toBe(a.accountDetails && a.compliance && a.trainings && a.services)
  })
})
