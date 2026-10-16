// The page read's in-memory catalogue selection (U1 worker-area, the backfill follow-up):
// selectCatalogueFor must pick exactly what readProfileRows's query would fetch for one
// worker -- the categories matched by id or name, their chosen sub-categories, or every
// sub-category when none is chosen (today's quirk, kept on purpose).
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { catalogueFilter, selectCatalogueFor, type CatalogueRecord } from '../../src/modules/worker/persistence/profile-read'
import { CATEGORIES, serviceRow, SUBCATEGORIES } from './generators'

const doc = (id: string) => ({ document: { id, name: id, category: 'COMPLIANCE', description: '' }, documentType: 'REQUIRED', conditionKey: null, requiredIfTrue: null })

/** A whole catalogue: every category with two sub-categories each, every sub-category carrying one document. */
const catalogue: CatalogueRecord[] = CATEGORIES.slice(0, 6).map((c, i) => ({
  id: c.id,
  name: c.name,
  documents: [doc(`${c.id}-doc`)],
  subcategories: [SUBCATEGORIES[i % SUBCATEGORIES.length]!, SUBCATEGORIES[(i + 1) % SUBCATEGORIES.length]!].map((s) => ({ id: s.id, name: s.name, additionalDocuments: [{ document: { id: `${s.id}-doc`, name: s.id, category: 'TRAINING', description: '' } }] })),
}))

/** The query's where clause, applied by hand: the oracle of the selection. */
function queryWould(all: CatalogueRecord[], services: Parameters<typeof selectCatalogueFor>[1]): CatalogueRecord[] {
  const f = catalogueFilter(services)
  return all
    .filter((c) => f.categoryIds.includes(c.id) || f.categoryNames.includes(c.name))
    .map((c) => ({ ...c, subcategories: f.subIds.length > 0 || f.subNames.length > 0 ? c.subcategories.filter((s) => f.subIds.includes(s.id) || f.subNames.includes(s.name)) : c.subcategories }))
}

describe('selectCatalogueFor', () => {
  it('equals the per-worker query for any set of services; empty without services', () => {
    expect(selectCatalogueFor(catalogue, [])).toEqual([])
    fc.assert(
      fc.property(fc.uniqueArray(serviceRow, { maxLength: 4, selector: (s) => s.categoryId }), (services) => {
        expect(selectCatalogueFor(catalogue, services)).toEqual(queryWould(catalogue, services))
      }),
      { numRuns: 200 },
    )
  })

  it('keeps every sub-category when none is chosen, and only the chosen ones otherwise', () => {
    const none = selectCatalogueFor(catalogue, [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: [], subcategoryNames: [] }])
    expect(none).toHaveLength(1)
    expect(none[0]!.subcategories).toHaveLength(2)
    const one = selectCatalogueFor(catalogue, [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: ['domestic-tasks'], subcategoryNames: ['Domestic Tasks'] }])
    expect(one[0]!.subcategories.map((s) => s.id)).toEqual(['domestic-tasks'])
    // Matched by name when the stored id differs from the catalogue's (today's query does the same).
    const byName = selectCatalogueFor(catalogue, [{ categoryId: 'something-else', categoryName: 'Nursing Services', subcategoryIds: [], subcategoryNames: [] }])
    expect(byName.map((c) => c.id)).toEqual(['nursing-services'])
  })
})
