// The requirement groups in the read (U1 worker-area, R4, L5): P5 and the fixed cases.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { BASE_COMPLIANCE_CATEGORIES, complianceOf, type RequirementRow } from '../../src/modules/worker/domain/completion'
import { FOLDED_TRAINING_IDS, linkedDocuments, requirementGroups, statusOfRows, TRAINING_STEP_ORDER } from '../../src/modules/worker/domain/requirement-groups'
import { completionInput, DOCUMENTS } from './generators'

describe('P5: requirementGroups', () => {
  it('lists only catalogue documents linked to the worker\'s services; missing items are exactly what the completion rules call absent', () => {
    fc.assert(
      fc.property(completionInput, (input) => {
        const g = requirementGroups({ profile: input.profile, services: input.services, requirements: input.requirements, catalogue: input.catalogue })
        if (input.services.length === 0) {
          expect(g).toEqual({ mandatory: [], trainings: [] })
          return
        }
        const linked = new Set(linkedDocuments(input.catalogue).map((d) => d.id))
        for (const item of g.mandatory) {
          if (item.id === 'code-of-conduct-part1') continue
          expect(linked.has(item.id), item.id).toBe(true)
          expect(BASE_COMPLIANCE_CATEGORIES.has(DOCUMENTS.find((d) => d.id === item.id)!.category)).toBe(true)
        }
        for (const item of g.trainings) {
          expect(linked.has(item.id), item.id).toBe(true)
          expect(FOLDED_TRAINING_IDS.has(item.id)).toBe(false)
          expect(DOCUMENTS.find((d) => d.id === item.id)!.category).toBe('TRAINING')
        }
        // Ids are unique within a group and part 2 never appears.
        expect(new Set(g.mandatory.map((i) => i.id)).size).toBe(g.mandatory.length)
        expect(g.mandatory.some((i) => i.id === 'code-of-conduct-part2')).toBe(false)
        expect(g.mandatory.filter((i) => i.id === 'code-of-conduct-part1')).toHaveLength(1)
        // The sidebar's order: known trainings in TRAINING_STEP_ORDER, unknown after them.
        const positions = g.trainings.map((i) => TRAINING_STEP_ORDER.indexOf(i.id)).map((i) => (i === -1 ? Number.MAX_SAFE_INTEGER : i))
        for (let i = 1; i < positions.length; i++) expect(positions[i]! >= positions[i - 1]!).toBe(true)
        // A missing unconditional REQUIRED item is a missing document for the compliance flag too (the groups and the
        // flag read the same rows); an OPTIONAL or conditional link is listed for the sidebar but not required (R3.3).
        const conditional = new Set(input.catalogue.categories.flatMap((c) => c.documents.filter((l) => l.conditionKey !== null).map((l) => l.document.id)))
        if (g.mandatory.some((i) => i.status === 'missing' && i.documentType === 'REQUIRED' && !conditional.has(i.id))) expect(complianceOf(input)).toBe(false)
        // The folded NDIS modules are required by the trainings flag though hidden from the group, so the converse is not asserted.
      }),
      { numRuns: 300 },
    )
  })

  const cat = (documents: string[], subDocs: string[] = []) => ({
    categories: [{ id: 'support-worker', name: 'Support Worker', documents: documents.map((id) => ({ document: DOCUMENTS.find((d) => d.id === id)!, documentType: 'REQUIRED', conditionKey: null, requiredIfTrue: null })), subcategories: [{ id: 'personal-care', name: 'Personal Care', additionalDocuments: subDocs.map((id) => ({ document: DOCUMENTS.find((d) => d.id === id)! })) }] }],
  })
  const services = [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: ['personal-care'], subcategoryNames: ['Personal Care'] }]
  const row = (requirementType: string, status: RequirementRow['status'] = 'SUBMITTED', documentCategory: RequirementRow['documentCategory'] = null): RequirementRow => ({ requirementType, status, documentCategory, documentUrl: null })

  it('splices Code of Conduct (Part 1) after abn-contractor, or appends it; carries documentType; folds the three NDIS modules', () => {
    const g = requirementGroups({ profile: { abn: null, hasVehicle: null }, services, requirements: [], catalogue: cat(['police-check', 'abn-contractor', 'right-to-work', 'ndis-induction-module', 'cpr', 'ndis-worker-orientation', 'safe-enjoyable-meals']) })
    expect(g.mandatory.map((i) => i.id)).toEqual(['police-check', 'abn-contractor', 'code-of-conduct-part1', 'right-to-work'])
    expect(g.trainings.map((i) => i.id)).toEqual(['ndis-worker-orientation', 'cpr'])
    expect(g.mandatory.every((i) => i.documentType === 'REQUIRED')).toBe(true)
    const noAbn = requirementGroups({ profile: { abn: null, hasVehicle: null }, services, requirements: [], catalogue: cat(['police-check']) })
    expect(noAbn.mandatory.map((i) => i.id)).toEqual(['police-check', 'code-of-conduct-part1'])
    expect(noAbn.mandatory[1]).toMatchObject({ name: 'Code of Conduct (Part 1)', status: 'approved' })
  })

  it('status per item uses the presence aliases (R4.3): identity needs both halves; the ABN itself counts; the orientation alias', () => {
    const catalogue = cat(['identity-points-100', 'abn-contractor', 'ndis-screening-check', 'ndis-worker-orientation'])
    const status = (requirements: RequirementRow[], abn: unknown = null) => Object.fromEntries(requirementGroups({ profile: { abn, hasVehicle: null }, services, requirements, catalogue }).mandatory.concat(requirementGroups({ profile: { abn, hasVehicle: null }, services, requirements, catalogue }).trainings).map((i) => [i.id, i.status]))
    expect(status([])).toMatchObject({ 'identity-points-100': 'missing', 'abn-contractor': 'missing', 'ndis-screening-check': 'missing', 'ndis-worker-orientation': 'missing' })
    expect(status([row('identity-passport', 'APPROVED', 'PRIMARY')])['identity-points-100']).toBe('missing')
    expect(status([row('identity-passport', 'APPROVED', 'PRIMARY'), row('driver-license-vehicle', 'SUBMITTED', 'SECONDARY')])['identity-points-100']).toBe('submitted')
    expect(status([row('identity-passport', 'APPROVED', 'PRIMARY'), row('driver-license-vehicle', 'APPROVED', 'SECONDARY')])['identity-points-100']).toBe('approved')
    expect(status([row('identity-passport', 'REJECTED', 'PRIMARY'), row('driver-license-vehicle', 'APPROVED', 'SECONDARY')])['identity-points-100']).toBe('rejected')
    expect(status([], { workerEngagementType: { type: 'abn', signed: true } })['abn-contractor']).toBe('submitted')
    expect(status([row('contract-of-agreement', 'EXPIRED')], { workerEngagementType: { type: 'abn', signed: true } })['abn-contractor']).toBe('expired')
    expect(status([row('worker-screening-check', 'APPROVED')])['ndis-screening-check']).toBe('approved')
    expect(status([row('ndis-training', 'SUBMITTED')])['ndis-worker-orientation']).toBe('submitted')
    expect(status([row('police-check', 'PENDING')])['abn-contractor']).toBe('missing')
  })

  it('statusOfRows: rejected beats expired beats approved beats submitted; PENDING alone is missing', () => {
    expect(statusOfRows([])).toBe('missing')
    expect(statusOfRows(['PENDING'])).toBe('missing')
    expect(statusOfRows(['PENDING', 'SUBMITTED'])).toBe('submitted')
    expect(statusOfRows(['APPROVED', 'APPROVED'])).toBe('approved')
    expect(statusOfRows(['APPROVED', 'SUBMITTED'])).toBe('submitted')
    expect(statusOfRows(['APPROVED', 'EXPIRED'])).toBe('expired')
    expect(statusOfRows(['EXPIRED', 'REJECTED'])).toBe('rejected')
  })

  it('is empty without services (R4.1), whatever the catalogue holds', () => {
    expect(requirementGroups({ profile: { abn: null, hasVehicle: null }, services: [], requirements: [row('police-check')], catalogue: cat(['police-check', 'cpr']) })).toEqual({ mandatory: [], trainings: [] })
  })
})
