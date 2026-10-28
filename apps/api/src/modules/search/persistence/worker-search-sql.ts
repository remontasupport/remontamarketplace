// The one statement behind both worker searches (search-locations U1, BR-E/K/S/D/O): eligibility, keywords,
// services, the radius from the place, the order, the page and the total in one round trip, under a statement
// timeout. Every value is a bound parameter; the HOME join and the PostGIS terms are the admin search's.
import { Prisma, readTransaction, type Db } from '../../../platform/persistence/db'
import { distanceTerm, HOME_JOIN, pointOf, withinTerm } from '../../locations/persistence/home-sql'
import type { Place } from '../../locations/domain/place'
import type { Keyword } from '../domain/keywords'

export const STATEMENT_TIMEOUT_MS = 5000

export interface SearchSpec {
  /** BR-E3: the client's default listing shows only workers with an introduction. */
  introductionRequired: boolean
  keywords: readonly Keyword[]
  /** Category names: any of them (BR-S1); empty for none. */
  services: readonly string[]
  place: Place | null
  withinKm: number
  page: number
  pageSize: number
}

export interface RawSearchRow {
  id: string
  firstName: string
  lastName: string
  photos: string | null
  introduction: string | null
  city: string | null
  state: string | null
  /** worker_services in the order they were added: category name and sub-category names. */
  services: { name: string; subs: string[] }[] | null
  approved: boolean
  distance_m: number | null
  total: number
}

const FROM = Prisma.sql`
  FROM worker_profiles p
  JOIN users u ON u.id = p."userId"
  LEFT JOIN worker_additional_info wai ON wai."workerProfileId" = p.id
  ${HOME_JOIN}`

/** `%token%` for ILIKE, the token's own wildcards and backslashes matched literally. */
export const containsPattern = (token: string) => `%${token.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/** BR-K3: a service token looks at the services and the qualifications; a text token at the profile's own words. */
function keywordTerm(k: Keyword): Prisma.Sql {
  const like = containsPattern(k.token)
  if (k.kind === 'service') {
    return Prisma.sql`(EXISTS (SELECT 1 FROM worker_services ws WHERE ws."workerProfileId" = p.id AND ws."categoryName" ILIKE ${like})
      OR p.qualifications ILIKE ${like} OR p."uniqueService" ILIKE ${like})`
  }
  return Prisma.sql`(p."firstName" ILIKE ${like} OR p."lastName" ILIKE ${like} OR p.introduction ILIKE ${like}
      OR p.hobbies ILIKE ${like} OR p."funFact" ILIKE ${like} OR wai.personality ILIKE ${like} OR wai."funFact" ILIKE ${like}
      OR ${k.token} = ANY(wai.interests) OR ${k.token} = ANY(wai."workPreferences"))`
}

export function whereOf(spec: SearchSpec): Prisma.Sql {
  // BR-E1: every unsuspended worker with a name, for both searches (the public list stopped requiring the admin's
  // activation switch: user 2026-10-28).
  const terms: Prisma.Sql[] = [Prisma.sql`u.status = 'ACTIVE'`, Prisma.sql`p."firstName" <> ''`, Prisma.sql`p."lastName" <> ''`]
  if (spec.introductionRequired) terms.push(Prisma.sql`p.introduction IS NOT NULL AND p.introduction <> ''`)
  for (const k of spec.keywords) terms.push(keywordTerm(k))
  if (spec.services.length > 0) {
    terms.push(Prisma.sql`EXISTS (SELECT 1 FROM worker_services ws WHERE ws."workerProfileId" = p.id AND ws."categoryName" = ANY(${[...spec.services]}::text[]))`)
  }
  return Prisma.join(terms, ' AND ')
}

export function searchStatement(spec: SearchSpec): Prisma.Sql {
  const point = spec.place ? pointOf(spec.place.lat, spec.place.lng) : null
  const distance = point ? distanceTerm(point) : Prisma.sql`NULL::double precision`
  // BR-O1/O2: nearest first with a place, then newest, then id (a total order: pages never overlap).
  const order = point ? Prisma.sql`distance_m ASC, p."createdAt" DESC, p.id ASC` : Prisma.sql`p."createdAt" DESC, p.id ASC`
  return Prisma.sql`
    SELECT p.id, p."firstName", p."lastName", p.photos, p.introduction,
           COALESCE(al.suburb, p.city) AS city, COALESCE(al.state, p.state) AS state,
           (SELECT json_agg(json_build_object('name', ws."categoryName", 'subs', ws."subcategoryNames") ORDER BY ws."createdAt", ws.id)
              FROM worker_services ws WHERE ws."workerProfileId" = p.id) AS services,
           EXISTS (SELECT 1 FROM verification_requirements vr WHERE vr."workerProfileId" = p.id AND vr.status = 'APPROVED') AS approved,
           ${distance} AS distance_m,
           COUNT(*) OVER()::int AS total
    ${FROM}
    WHERE ${whereOf(spec)}
    ${point ? withinTerm(point, spec.withinKm) : Prisma.empty}
    ORDER BY ${order}
    LIMIT ${spec.pageSize} OFFSET ${(spec.page - 1) * spec.pageSize}`
}

/** BR-O3: the total when the page is past the end (no row carries it then). */
export function totalStatement(spec: SearchSpec): Prisma.Sql {
  const point = spec.place ? pointOf(spec.place.lat, spec.place.lng) : null
  return Prisma.sql`SELECT COUNT(*)::int AS count ${FROM} WHERE ${whereOf(spec)} ${point ? withinTerm(point, spec.withinKm) : Prisma.empty}`
}

export async function runWorkerSearch(db: Db, spec: SearchSpec): Promise<{ rows: RawSearchRow[]; total: number }> {
  return readTransaction(db, STATEMENT_TIMEOUT_MS, async (tx) => {
    const rows = await tx.$queryRaw<RawSearchRow[]>(searchStatement(spec))
    let total = rows[0]?.total ?? 0
    if (rows.length === 0 && spec.page > 1) {
      const [t] = await tx.$queryRaw<{ count: number }[]>(totalStatement(spec))
      total = t?.count ?? 0
    }
    return { rows, total }
  })
}
