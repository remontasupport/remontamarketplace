// The filter registry as data (U2, rules R3): one row per filter of the requirements
// table, each contributing one parameterised SQL fragment. The statement ANDs the
// active fragments with the always-on active condition. Nothing here knows about
// another filter; adding one is one row (plus its contract field and its test).
//
// Aliases the statement guarantees: p = worker_profiles, u = users,
// wai = worker_additional_info (LEFT JOIN), wl = worker_locations HOME (LEFT JOIN),
// al = au_localities of that HOME (LEFT JOIN).
import { Prisma } from '../../../platform/persistence/db'
import { escapeLike, type SearchQuery } from '../domain/search-query'

export interface FilterSpec {
  name: string
  applies(q: SearchQuery): boolean
  sql(q: SearchQuery): Prisma.Sql
}

const like = (s: string) => `%${escapeLike(s)}%`

export const FILTERS: readonly FilterSpec[] = [
  {
    // R3.1: first name, last name or mobile contains the text; two or more words
    // also match first/last in either order ("Test Terson", "Terson Test").
    name: 'search',
    applies: (q) => q.search !== undefined,
    sql: (q) => {
      const whole = like(q.search!)
      const parts: Prisma.Sql[] = [
        Prisma.sql`p."firstName" ILIKE ${whole}`,
        Prisma.sql`p."lastName" ILIKE ${whole}`,
        Prisma.sql`p.mobile LIKE ${whole}`,
      ]
      if (q.searchParts.length >= 2) {
        const first = like(q.searchParts[0]!)
        const rest = like(q.searchParts.slice(1).join(' '))
        parts.push(Prisma.sql`(p."firstName" ILIKE ${first} AND p."lastName" ILIKE ${rest})`)
        parts.push(Prisma.sql`(p."lastName" ILIKE ${first} AND p."firstName" ILIKE ${rest})`)
      }
      return Prisma.sql`(${Prisma.join(parts, ' OR ')})`
    },
  },
  {
    // R3.2: by category id (the indexed, stable key).
    name: 'typeOfSupport',
    applies: (q) => q.typeOfSupport !== undefined,
    sql: (q) => Prisma.sql`EXISTS (SELECT 1 FROM worker_services ws WHERE ws."workerProfileId" = p.id AND ws."categoryId" = ${q.typeOfSupport})`,
  },
  {
    // R3.3: any of the selected sub-categories under therapeutic supports.
    name: 'therapeuticSubcategories',
    applies: (q) => q.therapeuticSubcategories.length > 0,
    sql: (q) =>
      Prisma.sql`EXISTS (SELECT 1 FROM worker_services ws WHERE ws."workerProfileId" = p.id AND ws."categoryId" = 'therapeutic-supports' AND ws."subcategoryIds" && ${q.therapeuticSubcategories}::text[])`,
  },
  {
    name: 'gender', // R3.4
    applies: (q) => q.gender !== undefined,
    sql: (q) => Prisma.sql`p.gender = ${q.gender}`,
  },
  {
    name: 'hasVehicle', // R3.5
    applies: (q) => q.hasVehicle !== undefined,
    sql: (q) => Prisma.sql`p."hasVehicle" = ${q.hasVehicle}`,
  },
  {
    // R3.6: the date-of-birth text window, else the integer age column (today's rule).
    name: 'age',
    applies: (q) => q.age !== undefined,
    sql: (q) =>
      Prisma.sql`((p."dateOfBirth" IS NOT NULL AND p."dateOfBirth" >= ${q.age!.minBirth} AND p."dateOfBirth" <= ${q.age!.maxBirth}) OR (p."dateOfBirth" IS NULL AND p.age BETWEEN ${q.age!.minAge} AND ${q.age!.maxAge}))`,
  },
  {
    // R3.7: the engagement type inside the abn JSON.
    name: 'workerType',
    applies: (q) => q.workerTypeCode !== undefined,
    sql: (q) => Prisma.sql`p.abn #>> '{workerEngagementType,type}' = ${q.workerTypeCode}`,
  },
  {
    // R3.8: the additional-info list when it has any language, else the profile's list; any of.
    name: 'languages',
    applies: (q) => q.languages.length > 0,
    sql: (q) =>
      Prisma.sql`((COALESCE(array_length(wai.languages, 1), 0) > 0 AND wai.languages && ${q.languages}::text[]) OR (COALESCE(array_length(wai.languages, 1), 0) = 0 AND p.languages && ${q.languages}::text[]))`,
  },
  {
    // R3.9: all of the selected domains.
    name: 'experienceWith',
    applies: (q) => q.experienceWith.length > 0,
    sql: (q) =>
      Prisma.join(
        q.experienceWith.map((d) => Prisma.sql`EXISTS (SELECT 1 FROM worker_experience we WHERE we."workerProfileId" = p.id AND we.domain = ${d}::"CareDomain")`),
        ' AND ',
      ),
  },
  {
    // R3.11: the domain's row carries any of the chosen specific areas; one such
    // condition per domain, all of them. The domain's own EXISTS (R3.9) stays: the
    // query guarantees the domain is searched, and this spec knows nothing of that one.
    name: 'experienceAreas',
    applies: (q) => q.experienceAreas.length > 0,
    sql: (q) =>
      Prisma.join(
        Object.entries(q.experienceAreasByDomain)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(
            ([d, areas]) =>
              Prisma.sql`EXISTS (SELECT 1 FROM worker_experience we WHERE we."workerProfileId" = p.id AND we.domain = ${d}::"CareDomain" AND we."specificAreas" && ${areas}::text[])`,
          ),
        ' AND ',
      ),
  },
]

/** R3.10: the base condition every list shares. */
export const ACTIVE = Prisma.sql`u.status = 'ACTIVE'`

/** The WHERE body: the active condition and one fragment per active filter, ANDed. */
export function whereOf(q: SearchQuery): Prisma.Sql {
  const parts = [ACTIVE, ...FILTERS.filter((f) => f.applies(q)).map((f) => Prisma.sql`(${f.sql(q)})`)]
  return Prisma.join(parts, ' AND ')
}

/** The names of the filters a query activates (for logs and tests). */
export function activeFilters(q: SearchQuery): string[] {
  return FILTERS.filter((f) => f.applies(q)).map((f) => f.name)
}
