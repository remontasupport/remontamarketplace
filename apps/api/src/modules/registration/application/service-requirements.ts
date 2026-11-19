// GET /v1/service-requirements (signup-abn-agreement, 2026-11-19): what one service will ask of the worker, for the
// sign-up's services notice. The catalogue is the dashboard's (the cached whole catalogue, the same selection the
// profile read makes); the rules are the dashboard's (serviceRequirementsPreview).
import type { ServiceRequirementsPreview } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import type { Db } from '../../../platform/persistence/db'
import { serviceRequirementsPreview } from '../../worker/domain/service-requirements-preview'
import { selectCatalogueFor, wholeCatalogue } from '../../worker/persistence/profile-read'

export async function listServiceRequirements(db: Db, query: { categoryId: string; subcategoryIds: string[] }): Promise<ServiceRequirementsPreview> {
  const all = await wholeCatalogue(db)
  const category = all.find((c) => c.id === query.categoryId)
  if (!category) throw new ApiError(404, `service ${query.categoryId} not in the catalogue`)
  const chosen = category.subcategories.filter((s) => query.subcategoryIds.includes(s.id))
  const service = { categoryId: category.id, categoryName: category.name, subcategoryIds: chosen.map((s) => s.id), subcategoryNames: chosen.map((s) => s.name) }
  return serviceRequirementsPreview(service, { categories: selectCatalogueFor(all, [service]) })
}
