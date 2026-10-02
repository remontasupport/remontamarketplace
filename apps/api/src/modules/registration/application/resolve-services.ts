// The services a worker chose, checked against the catalogue: every service must be
// a Category, every sub-category must belong to a chosen one. Returns rows in the
// order the worker chose them, shaped for worker_services. Shared by the sign-up
// and, later, by editing services during onboarding.
import { ApiError } from '../../../platform/errors'
import type { Db, Tx } from '../../../platform/persistence/db'

export interface ResolvedService {
  categoryId: string
  categoryName: string
  subcategoryIds: string[]
  subcategoryNames: string[]
}

export async function resolveServices(db: Db | Tx, serviceIds: readonly string[], subIds: readonly string[]): Promise<ResolvedService[]> {
  const categories = await db.category.findMany({
    where: { id: { in: [...serviceIds] } },
    select: { id: true, name: true, subcategories: { select: { id: true, name: true } } },
  })
  const unknown = serviceIds.filter((id) => !categories.some((c) => c.id === id))
  if (unknown.length) throw new ApiError(400, `unknown services ${unknown.join(',')}`, { services: ['Please choose services from the list'] })

  const owner = new Map<string, { categoryId: string; name: string }>()
  for (const c of categories) for (const s of c.subcategories) owner.set(s.id, { categoryId: c.id, name: s.name })
  const stray = subIds.filter((id) => !owner.has(id))
  if (stray.length) {
    throw new ApiError(400, `sub-categories outside the chosen services ${stray.join(',')}`, {
      supportWorkerCategories: ['Please choose categories that belong to your selected services'],
    })
  }
  return serviceIds.map((id) => {
    const c = categories.find((x) => x.id === id)!
    const mine = subIds.filter((s) => owner.get(s)!.categoryId === id)
    return { categoryId: c.id, categoryName: c.name, subcategoryIds: mine, subcategoryNames: mine.map((s) => owner.get(s)!.name) }
  })
}
