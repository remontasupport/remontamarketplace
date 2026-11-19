// signup-abn-agreement (2026-11-19): what a service asks of a worker, for the sign-up's services notice, by the
// dashboard's own rules. No database.
import { describe, expect, it } from 'vitest'
import { serviceRequirementsPreview } from '../../src/modules/worker/domain/service-requirements-preview'
import { DOCUMENTS } from './generators'

const doc = (id: string) => DOCUMENTS.find((d) => d.id === id)!
const link = (id: string, documentType = 'REQUIRED', conditionKey: string | null = null) => ({ document: doc(id), documentType, conditionKey, requiredIfTrue: conditionKey ? true : null })

const supportWorker = {
  categories: [
    {
      id: 'support-worker',
      name: 'Support Worker',
      documents: [
        link('identity-points-100'),
        link('police-check'),
        link('abn-contractor'),
        link('ndis-induction-module'),
        link('effective-communication'),
        link('manual-handling', 'OPTIONAL'),
        link('drivers-licence', 'CONDITIONAL', 'hasVehicle'),
        link('public-liability-10m', 'OPTIONAL'),
      ],
      subcategories: [{ id: 'personal-care', name: 'Personal Care', additionalDocuments: [] }],
    },
  ],
}
const service = { categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: ['personal-care'], subcategoryNames: ['Personal Care'] }

describe('serviceRequirementsPreview', () => {
  it("lists the dashboard's groups for the service: compliance, the NDIS modules, conditional credentials marked; required only", () => {
    const out = serviceRequirementsPreview(service, supportWorker)
    expect(out.service).toBe('Support Worker')
    const group = (title: string) => out.groups.find((g) => g.title === title)?.items.map((i) => i.name) ?? []
    expect(group('Compliance')).toEqual(expect.arrayContaining([doc('identity-points-100').name, doc('police-check').name, doc('abn-contractor').name]))
    expect(group('Trainings')).toEqual([doc('ndis-induction-module').name, doc('effective-communication').name]) // the folded modules are listed; the optional one is not
    expect(out.groups.find((g) => g.title === 'Additional credentials')?.items).toEqual([{ name: "Driver's Licence", ifApplicable: true }])
    expect(group('Service documents')).toEqual([]) // Support Worker has only optional ones
    expect(out.groups.every((g) => g.items.length > 0)).toBe(true) // an empty group is left out
  })

  it("adds the service's own required documents (Nursing Services: AHPRA and the qualification)", () => {
    const nursing = { categories: [{ ...supportWorker.categories[0]!, id: 'nursing-services', name: 'Nursing Services', subcategories: [] }] }
    const out = serviceRequirementsPreview({ categoryId: 'nursing-services', categoryName: 'Nursing Services', subcategoryIds: [], subcategoryNames: [] }, nursing)
    expect(out.groups.find((g) => g.title === 'Service documents')?.items.map((i) => i.name)).toEqual(['AHPRA Registration', 'Nursing Qualification Certificate'])
  })
})
