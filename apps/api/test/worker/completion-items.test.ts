// "Complete", declared once (onboarding-tour C1): the 18-page table case by case, the Services and Compliance items,
// the on-purpose differences from today's rules, and the properties of the functional design (P8 of C1): the percent
// counts the done required pages; My Profile complete <=> 100; profile complete <=> the three groups; `legacy` is
// today's completionOf exactly; where the rules agree the groups equal today's flags; a pure function of the rows.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { completionItems, completionView, MY_PROFILE_ITEMS as MY_PROFILE_PAGES, REQUIRED_MY_PROFILE_PAGES, storedCompletion } from '../../src/modules/worker/application/completion-items'
import { completionInputOf } from '../../src/modules/worker/application/get-profile'
import { completionOf } from '../../src/modules/worker/domain/completion'
import type { ProfileRows } from '../../src/modules/worker/persistence/profile-read'
import { sampleRows } from './units.test'

type P = ProfileRows['profile']
const info = (patch: Partial<NonNullable<P['workerAdditionalInfo']>> = {}): P['workerAdditionalInfo'] => ({ ...sampleRows().profile.workerAdditionalInfo!, ...patch })
const item = (rows: ProfileRows, id: string) => completionItems(rows).find((i) => i.id === id)!
const group = (rows: ProfileRows, id: string) => completionView(rows).groups.find((g) => g.id === id)!

describe('the My Profile table (E2)', () => {
  it('is the sidebar\'s 18 slugs in its order, 10 required (Language optional, user 2026-10-21)', () => {
    expect(MY_PROFILE_PAGES.map((p) => p.slug)).toEqual(['name', 'photo', 'bio', 'address', 'date-of-birth', 'gender', 'languages', 'experience', 'work-history', 'education', 'preferred-hours', 'vehicle', 'cultural-background', 'religion', 'interests', 'about-me', 'preferences', 'personality'])
    expect(MY_PROFILE_PAGES.filter((p) => !p.required).map((p) => p.slug)).toEqual(['address', 'languages', 'cultural-background', 'religion', 'interests', 'about-me', 'preferences', 'personality'])
    expect(REQUIRED_MY_PROFILE_PAGES).toBe(10)
  })
  const cases: [string, Partial<P>, boolean][] = [
    ['name', { lastName: '  ' }, false],
    ['photo', { photos: null }, false],
    ['bio', { introduction: 'x'.repeat(49) }, false],
    ['bio', { introduction: ` ${'x'.repeat(50)} ` }, true],
    ['date-of-birth', { dateOfBirth: null, age: 40 }, true],
    ['date-of-birth', { dateOfBirth: null, age: null }, false],
    ['gender', { gender: '' }, false],
    ['languages', { workerAdditionalInfo: info({ languages: [] }), languages: ['English'] }, true],
    ['languages', { workerAdditionalInfo: info({ languages: [' '] }), languages: [] }, false],
    ['experience', { careExperience: [] }, false],
    ['work-history', { jobHistoryEntries: [] }, false],
    ['education', { educationEntries: [] }, false],
    ['preferred-hours', { availability: [] }, false],
    ['vehicle', { hasVehicle: 'No' }, true],
    ['vehicle', { hasVehicle: null }, false],
    ['address', { homeLocality: { id: 1, suburb: 'Parramatta', state: 'NSW', postcode: '2150' } }, true],
    ['address', { homeLocality: null }, false],
    ['interests', { workerAdditionalInfo: info({ interests: [] }) }, false],
    ['personality', { workerAdditionalInfo: info({ personality: '  ' }) }, false],
    ['about-me', { workerAdditionalInfo: info({ uniqueService: ['Outings'] }) }, true],
  ]
  it.each(cases)('%s with %j is done = %s', (slug, patch, done) => {
    expect(item(sampleRows(patch), slug).done).toBe(done)
  })
})

describe('the groups (E3, E4, CR-2..CR-7)', () => {
  it('the sample: education missing -> 9 of 10, 90 %, My Profile incomplete with education next', () => {
    const v = completionView(sampleRows())
    expect(v.percent).toBe(90)
    expect(v.groups[0]).toEqual({ id: 'my-profile', complete: false, done: 9, total: 10, firstUnfinished: 'education' })
  })
  it('optional pages never hold My Profile back; a filled education completes it', () => {
    const rows = sampleRows({ educationEntries: [{ id: 'e1', qualification: 'Cert III', institution: 'TAFE', startMonth: 'January', startYear: 2019, endMonth: 'December', endYear: 2019, currentlyStudying: false } as never], workerAdditionalInfo: info({ religion: [], culturalBackground: [], interests: [], workPreferences: [], uniqueService: [], personality: null }) })
    const v = completionView(rows)
    expect(v.percent).toBe(100)
    expect(v.groups[0]).toMatchObject({ complete: true, firstUnfinished: null })
  })
  it('no services: Compliance has no items and its next step is choosing a service (requirementGroups R4.1)', () => {
    expect(group(sampleRows({ workerServices: [] }), 'compliance')).toMatchObject({ complete: false, total: 0, firstUnfinished: 'services-chosen' })
  })
  it('Services: a service, its documents, the Service Area (CD4, CD5); no services -> the first step is choosing them', () => {
    expect(group(sampleRows(), 'services')).toMatchObject({ complete: false, total: 3, firstUnfinished: 'service-documents:support-worker' }) // Support Worker: one optional document needed (Q3 A)
    expect(group(sampleRows({ workerServices: [] }), 'services')).toMatchObject({ complete: false, firstUnfinished: 'services-chosen' })
    expect(group(sampleRows({ locations: [] }), 'services').firstUnfinished).toBe('service-documents:support-worker')
  })
  it('a service whose documents are uploaded and a Service Area: Services complete', () => {
    const rows = sampleRows({ verificationRequirements: [...sampleRows().profile.verificationRequirements, { id: 'vr2', requirementType: 'Support Worker:qualification-certificate', requirementName: 'Cert', status: 'SUBMITTED', documentCategory: 'SERVICE_QUALIFICATION', documentUrl: null, expiresAt: null, documentUploadedAt: null, metadata: null }] })
    expect(group(rows, 'services')).toMatchObject({ complete: true, done: 3, firstUnfinished: null })
    expect(group({ ...rows, profile: { ...rows.profile, locations: [] } }, 'services').firstUnfinished).toBe('service-area')
  })
  it('Compliance = today\'s compliance && trainings; its items come from the requirement groups', () => {
    const rows = sampleRows()
    const input = completionInputOf(rows)
    const today = completionOf(input)
    expect(group(rows, 'compliance').complete).toBe(today.compliance && today.trainings)
    expect(completionItems(rows).filter((i) => i.group === 'compliance').map((i) => i.id)).toEqual(['compliance:police-check', 'compliance:code-of-conduct-part1'])
  })
  it('the service documents the step asks for come from the api\'s table, with what is uploaded (CR-14)', () => {
    const docs = completionView(sampleRows()).serviceDocuments
    expect(docs).toHaveLength(1)
    expect(docs[0]!.categoryId).toBe('support-worker')
    expect(docs[0]!.documents.find((d) => d.type === 'qualification-certificate')).toMatchObject({ required: false, uploaded: false })
  })
})

describe('the on-purpose differences from today (business-rules.md)', () => {
  it('My Profile needs no suburb: without city/state/postcode, today\'s accountDetails is false, the new My Profile item set is unaffected', () => {
    const rows = sampleRows({ city: null, state: null, postalCode: null })
    expect(completionOf(completionInputOf(rows)).accountDetails).toBe(false)
    expect(completionItems(rows).filter((i) => i.group === 'my-profile').map((i) => i.done)).toEqual(completionItems(sampleRows()).filter((i) => i.group === 'my-profile').map((i) => i.done))
  })
  it('the bio needs 50+ characters (today\'s accountDetails accepted any)', () => {
    const rows = sampleRows({ introduction: 'Short bio.' })
    expect(item(rows, 'bio').done).toBe(false)
  })
  it('the percent is over the 10 required pages, not today\'s 13 sections', () => {
    expect(completionOf(completionInputOf(sampleRows())).percent).toBe(92)
    expect(completionView(sampleRows()).percent).toBe(90)
  })
})

// ---- Properties ----------------------------------------------------------------------------------------------------

const rowsArb = fc
  .record({
    name: fc.boolean(), photo: fc.boolean(), bio: fc.boolean(), dob: fc.boolean(), gender: fc.boolean(), lang: fc.boolean(), exp: fc.boolean(), job: fc.boolean(), edu: fc.boolean(),
    hours: fc.boolean(), vehicle: fc.constantFrom<string | null>('yes', 'No', null, ''), services: fc.boolean(), home: fc.boolean(), legacyPlace: fc.boolean(), qual: fc.boolean(), police: fc.constantFrom('APPROVED', 'SUBMITTED', 'REJECTED', 'PENDING'),
  })
  .map((g): ProfileRows => {
    const base = sampleRows()
    return sampleRows({
      lastName: g.name ? 'Smith' : '',
      photos: g.photo ? 'https://blob.test/p.jpg' : null,
      introduction: g.bio ? 'x'.repeat(60) : 'short',
      dateOfBirth: g.dob ? '1990-01-01' : null,
      age: null,
      gender: g.gender ? 'Female' : null,
      languages: [],
      workerAdditionalInfo: info({ languages: g.lang ? ['English'] : [] }),
      careExperience: g.exp ? base.profile.careExperience : [],
      jobHistoryEntries: g.job ? base.profile.jobHistoryEntries : [],
      educationEntries: g.edu ? [{ id: 'e1' } as never] : [],
      availability: g.hours ? base.profile.availability : [],
      hasVehicle: g.vehicle,
      workerServices: g.services ? base.profile.workerServices : [],
      locations: g.home ? base.profile.locations : [],
      city: g.legacyPlace ? 'Parramatta' : null,
      verificationRequirements: [
        { ...base.profile.verificationRequirements[0]!, status: g.police as never },
        ...(g.qual ? [{ id: 'vr2', requirementType: 'Support Worker:qualification-certificate', requirementName: 'Cert', status: 'APPROVED' as const, documentCategory: 'SERVICE_QUALIFICATION' as const, documentUrl: null, expiresAt: null, documentUploadedAt: null, metadata: null }] : []),
      ],
    })
  })

describe('properties', () => {
  it('the percent = the done required My Profile pages / 10; My Profile complete <=> 100; profile complete <=> the three groups', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const v = completionView(rows)
        const doneRequired = v.items.filter((i) => i.group === 'my-profile' && i.required && i.done).length
        expect(v.percent).toBe(Math.round((100 * doneRequired) / 10))
        expect(v.groups[0]!.complete).toBe(v.percent === 100)
        expect(v.profileCompleted).toBe(v.groups.every((g) => g.complete))
        for (const g of v.groups) expect(g.firstUnfinished === null).toBe(g.complete)
      }),
    )
  })
  it('legacy is today\'s completionOf, exactly (E6)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        expect(storedCompletion(rows, 'legacy')).toEqual(completionOf(completionInputOf(rows)))
      }),
    )
  })
  it('groups: compliance and trainings as today; accountDetails = My Profile; services = the Services group; profileCompleted = the three', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const today = completionOf(completionInputOf(rows))
        const g = storedCompletion(rows, 'groups')
        const v = completionView(rows)
        expect([g.compliance, g.trainings]).toEqual([today.compliance, today.trainings])
        expect(g.accountDetails).toBe(v.groups[0]!.complete)
        expect(g.services).toBe(v.groups[1]!.complete)
        expect(g.profileCompleted).toBe(v.profileCompleted)
        // Where the rules agree: Services complete implies today's services flag (it adds the Service Area only).
        if (g.services) expect(today.services).toBe(true)
      }),
    )
  })
  it('a pure function of the rows: the same rows give the same view', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        expect(completionView(structuredClone(rows))).toEqual(completionView(rows))
      }),
    )
  })
})
