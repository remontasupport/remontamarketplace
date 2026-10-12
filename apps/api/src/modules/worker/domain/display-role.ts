// R5.1 (U1 worker-area, Q5 A): today's rule from the app's profile route, ported.
export interface DisplayRoleService {
  categoryName: string
  subcategoryNames: string[]
  createdAt: Date
}

export const DEFAULT_DISPLAY_ROLE = 'Support Worker'
const THERAPEUTIC = 'Therapeutic Supports'

/** The first service by creation: a therapeutic one shows its sub-categories joined by ' / ', any other its name; none -> 'Support Worker'. */
export function displayRoleOf(services: readonly DisplayRoleService[]): string {
  const first = [...services].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
  if (!first) return DEFAULT_DISPLAY_ROLE
  if (first.categoryName === THERAPEUTIC && first.subcategoryNames.length > 0) return first.subcategoryNames.join(' / ')
  return first.categoryName
}
