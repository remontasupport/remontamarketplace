// The category and sub-category names the keyword classifier reads (BR-K2), lower case, held for an hour per
// instance (the app route held them in Redis for the same hour). A failed read is not cached.
import type { Clock } from '../../../platform/clock'
import type { Db } from '../../../platform/persistence/db'

export const SERVICE_TERMS_TTL_MS = 60 * 60 * 1000

export function serviceTerms(db: Db, clock: Clock): () => Promise<ReadonlySet<string>> {
  let held: { terms: ReadonlySet<string>; until: number } | null = null
  return async () => {
    const now = clock().getTime()
    if (held && now < held.until) return held.terms
    const [categories, subcategories] = await Promise.all([db.category.findMany({ select: { name: true } }), db.subcategory.findMany({ select: { name: true } })])
    const terms = new Set([...categories, ...subcategories].map((c) => c.name.toLowerCase()))
    held = { terms, until: now + SERVICE_TERMS_TTL_MS }
    return terms
  }
}
