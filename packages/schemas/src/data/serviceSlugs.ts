// The marketing site's service slugs (search-locations U1, CS-3): the `typeOfSupport` value of the public worker
// search and the category name it stands for (worker_services.categoryName). Declared once for apps/api and apps/web.

export const SERVICE_SLUG_NAMES = {
  'support-worker': 'Support Worker',
  'therapeutic-supports': 'Therapeutic Supports',
  'home-modifications': 'Home Modifications',
  'fitness-rehabilitation': 'Fitness and Rehabilitation',
  'cleaning-services': 'Cleaning Services',
  'nursing-services': 'Nursing Services',
  'home-yard-maintenance': 'Home and Yard Maintenance',
} as const

/** The category name of a slug; an unknown slug is taken as a category name, as the app route did. */
export function categoryNameOfSlug(slug: string): string {
  return (SERVICE_SLUG_NAMES as Record<string, string>)[slug] ?? slug
}
