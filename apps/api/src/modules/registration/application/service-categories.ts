// The service catalogue for the sign-up's services step (GET /v1/service-categories).
// Read-only; the same rows resolve-services checks the chosen ids against.
import type { serviceCategorySchema } from '@remonta/api-contract'
import type * as z from 'zod'
import type { Db } from '../../../platform/persistence/db'

/** The categories shown first, in this order; the rest follow by name. Same order as apps/app's /api/categories. */
export const CATEGORY_ORDER = [
  'Support Worker',
  'Support Worker (High Intensity)',
  'Cleaning Services',
  'Home and Yard Maintenance',
  'Therapeutic Supports',
  'Nursing Services',
] as const

/** The response shape is the contract's; the pipeline rejects anything else. */
export type ServiceCategory = z.output<typeof serviceCategorySchema>

export function orderCategories<T extends { name: string }>(categories: readonly T[]): T[] {
  const rank = (name: string) => {
    const i = (CATEGORY_ORDER as readonly string[]).indexOf(name)
    return i === -1 ? CATEGORY_ORDER.length : i
  }
  return [...categories].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
}

export async function listServiceCategories(db: Db): Promise<ServiceCategory[]> {
  const rows = await db.category.findMany({
    select: {
      id: true,
      name: true,
      requiresQualification: true,
      subcategories: { select: { id: true, name: true, requiresRegistration: true }, orderBy: { name: 'asc' } },
    },
  })
  return orderCategories(rows)
}
