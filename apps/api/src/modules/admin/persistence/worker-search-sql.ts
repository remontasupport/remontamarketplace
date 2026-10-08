// The one statement (U2, functional design L2/L3, rules R4, R5): the filters, the
// location term, the distance sort, the page and the total in one round trip, plus
// the unplaced count in the same short transaction, under a statement timeout.
// Every value is a bound parameter; the only raw text is the sort column, chosen
// from a fixed map.
import { Prisma, type Db } from '../../../platform/persistence/db'
import { whereOf } from '../application/filters'
import type { SearchQuery, SortField } from '../domain/search-query'

export const STATEMENT_TIMEOUT_MS = 5000

/** What the statement selects; shaped into the contract's row by the service. */
export interface RawWorkerRow {
  id: string
  userId: string
  firstName: string
  lastName: string
  mobile: string
  gender: string | null
  age: number | null
  dateOfBirth: string | null
  languages: string[]
  city: string | null
  state: string | null
  postalCode: string | null
  photos: string | null
  experience: string | null
  introduction: string | null
  createdAt: Date
  updatedAt: Date
  email: string
  userStatus: string
  infoLanguages: string[] | null
  serviceNames: string[] | null
  serviceIds: string[] | null
  homeSuburb: string | null
  homeState: string | null
  homePostcode: string | null
  precision: 'LOCALITY' | 'ADDRESS' | null
  travelRadiusKm: number | null
  distance_m: number | null
  total: number
}

/** R5.1: the sort keys; city and state come from the HOME locality, else the legacy columns. */
const SORT: Record<SortField, Prisma.Sql> = {
  createdAt: Prisma.sql`p."createdAt"`,
  firstName: Prisma.sql`p."firstName"`,
  lastName: Prisma.sql`p."lastName"`,
  city: Prisma.sql`COALESCE(al.suburb, p.city)`,
  state: Prisma.sql`COALESCE(al.state, p.state)`,
  distance: Prisma.sql`distance_m`,
}

const FROM = Prisma.sql`
  FROM worker_profiles p
  JOIN users u ON u.id = p."userId"
  LEFT JOIN worker_additional_info wai ON wai."workerProfileId" = p.id
  LEFT JOIN worker_locations wl ON wl."workerProfileId" = p.id AND wl.kind = 'HOME'
  LEFT JOIN au_localities al ON al.id = wl."localityId"`

/** The location term (R4): with a suburb, placed workers (within the radius if given); unmapped-only lists the rest. */
function locationTerm(q: SearchQuery, localityId: number | undefined): Prisma.Sql {
  if (q.unplaced) return Prisma.sql`AND wl.id IS NULL`
  if (localityId === undefined) return Prisma.empty
  if (q.withinKm === undefined) return Prisma.sql`AND wl.point IS NOT NULL`
  return Prisma.sql`AND wl.point IS NOT NULL AND ST_DWithin(wl.point, (SELECT point FROM au_localities WHERE id = ${localityId}), ${q.withinKm * 1000})`
}

export function searchStatement(q: SearchQuery, localityId: number | undefined): Prisma.Sql {
  const distance = localityId !== undefined && !q.unplaced ? Prisma.sql`ST_Distance(wl.point, (SELECT point FROM au_localities WHERE id = ${localityId}))` : Prisma.sql`NULL::double precision`
  const order = Prisma.sql`${SORT[q.sortBy]} ${q.sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`}`
  const offset = (q.page - 1) * q.pageSize
  return Prisma.sql`
    SELECT p.id, p."userId", p."firstName", p."lastName", p.mobile, p.gender, p.age, p."dateOfBirth",
           p.languages, p.city, p.state, p."postalCode", p.photos, p.experience, p.introduction,
           p."createdAt", p."updatedAt",
           u.email, u.status AS "userStatus",
           wai.languages AS "infoLanguages",
           (SELECT array_agg(DISTINCT ws."categoryName") FROM worker_services ws WHERE ws."workerProfileId" = p.id) AS "serviceNames",
           (SELECT array_agg(DISTINCT ws."categoryId") FROM worker_services ws WHERE ws."workerProfileId" = p.id) AS "serviceIds",
           al.suburb AS "homeSuburb", al.state AS "homeState", al.postcode AS "homePostcode",
           wl.precision::text AS precision, wl."travelRadiusKm",
           ${distance} AS distance_m,
           COUNT(*) OVER()::int AS total
    ${FROM}
    WHERE ${whereOf(q)}
    ${locationTerm(q, localityId)}
    ORDER BY ${order}, p.id ASC
    LIMIT ${q.pageSize} OFFSET ${offset}`
}

/** R4.4: active workers matching the other filters who have no HOME row. */
export function unplacedCountStatement(q: SearchQuery): Prisma.Sql {
  return Prisma.sql`SELECT COUNT(*)::int AS count ${FROM} WHERE ${whereOf(q)} AND wl.id IS NULL`
}

/** R5.2: the total when the page is past the end (no row carries it then). */
function totalStatement(q: SearchQuery, localityId: number | undefined): Prisma.Sql {
  return Prisma.sql`SELECT COUNT(*)::int AS count ${FROM} WHERE ${whereOf(q)} ${locationTerm(q, localityId)}`
}

export interface SearchResult {
  rows: RawWorkerRow[]
  total: number
  unplacedCount: number
}

/** One short transaction (R5.5): the statement timeout, the page, the unplaced count. */
export async function runSearch(db: Db, q: SearchQuery, localityId: number | undefined, opts: { statementTimeoutMs?: number } = {}): Promise<SearchResult> {
  const timeout = Math.max(100, Math.min(60_000, Math.trunc(opts.statementTimeoutMs ?? STATEMENT_TIMEOUT_MS)))
  return db.$transaction(
    async (tx) => {
      // SET takes no bind parameter; the value is a bounded integer constant, never input.
      await tx.$executeRaw(Prisma.raw(`SET LOCAL statement_timeout = ${timeout}`))
      const rows = await tx.$queryRaw<RawWorkerRow[]>(searchStatement(q, localityId))
      const [unplaced] = await tx.$queryRaw<{ count: number }[]>(unplacedCountStatement(q))
      let total = rows[0]?.total ?? 0
      if (rows.length === 0 && q.page > 1) {
        const [t] = await tx.$queryRaw<{ count: number }[]>(totalStatement(q, localityId))
        total = t?.count ?? 0
      }
      return { rows, total, unplacedCount: unplaced?.count ?? 0 }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 },
  )
}
