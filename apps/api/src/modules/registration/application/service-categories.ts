// The service catalogue for the sign-up's services step (GET /v1/service-categories).
// Read-only; the same rows register-worker checks the chosen ids against.
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

export interface ServiceCategory {
  id: string
  name: string
  requiresQualification: boolean
  subcategories: { id: string; name: string; requiresRegistration: string | null }[]
}

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
