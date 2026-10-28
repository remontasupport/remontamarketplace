// admin-clients U1 (BR-1, BR-2): the clients / coordinators list in SQL. service_requests has no foreign key to users,
// so Prisma relations cannot express the request count or the status filter; one statement per page and one for the
// total share a single WHERE. Every value is a bound parameter; the profile table and the organisation column come
// from a fixed map keyed by the role (never input text).
import type { RequesterListQueryParsed, RequesterRole } from '@remonta/api-contract'
import { Prisma, readTransaction, type Db } from '../../../platform/persistence/db'
import { escapeLike } from '../domain/search-query'

export const STATEMENT_TIMEOUT_MS = 5000

type Filters = Omit<RequesterListQueryParsed, 'page' | 'pageSize'> & { userId?: string }

/** What the statement selects; also the detail page's profile row (requesters.ts reads the same columns). */
export interface RawRequesterRow {
  userId: string
  role: RequesterRole
  email: string
  firstName: string
  lastName: string
  mobile: string
  organisation: string | null
  participantCount: number
  requestCount: number
}

const PROFILE: Record<RequesterRole, { table: Prisma.Sql; organisation: Prisma.Sql }> = {
  CLIENT: { table: Prisma.sql`client_profiles`, organisation: Prisma.sql`NULL::text` },
  COORDINATOR: { table: Prisma.sql`coordinator_profiles`, organisation: Prisma.sql`pr.organization` },
}

/** Aliases: u = users, pr = the role's profile. */
function fromWhere(q: Filters): Prisma.Sql {
  const terms = [Prisma.sql`u.role = ${q.role}::"UserRole"`]
  if (q.userId !== undefined) terms.push(Prisma.sql`u.id = ${q.userId}`)
  if (q.search) {
    const p = `%${escapeLike(q.search)}%`
    terms.push(Prisma.sql`(u.email ILIKE ${p} OR pr."firstName" ILIKE ${p} OR pr."lastName" ILIKE ${p})`)
  }
  if (q.requestStatus) {
    terms.push(Prisma.sql`EXISTS (SELECT 1 FROM service_requests sr WHERE sr."requesterId" = u.id AND sr.status = ${q.requestStatus}::"ServiceRequestStatus")`)
  }
  if (q.fundingType) {
    terms.push(Prisma.sql`EXISTS (SELECT 1 FROM participants pa WHERE pa."userId" = u.id AND pa."fundingType" = ${q.fundingType}::"FundingType")`)
  }
  return Prisma.sql`FROM users u JOIN ${PROFILE[q.role].table} pr ON pr."userId" = u.id WHERE ${Prisma.join(terms, ' AND ')}`
}

function selectRows(q: Filters): Prisma.Sql {
  return Prisma.sql`
    SELECT u.id AS "userId", u.role::text AS role, u.email, pr."firstName", pr."lastName", pr.mobile,
           ${PROFILE[q.role].organisation} AS organisation,
           (SELECT COUNT(*)::int FROM participants pa WHERE pa."userId" = u.id) AS "participantCount",
           (SELECT COUNT(*)::int FROM service_requests sr WHERE sr."requesterId" = u.id) AS "requestCount"
    ${fromWhere(q)}`
}

/** One page, newest account first, and the total, in one bounded read. */
export async function runRequesterList(db: Db, q: RequesterListQueryParsed): Promise<{ rows: RawRequesterRow[]; total: number }> {
  return readTransaction(db, STATEMENT_TIMEOUT_MS, async (tx) => {
    const rows = await tx.$queryRaw<RawRequesterRow[]>(
      Prisma.sql`${selectRows(q)} ORDER BY u."createdAt" DESC, u.id ASC LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
    )
    const [t] = await tx.$queryRaw<{ count: number }[]>(Prisma.sql`SELECT COUNT(*)::int AS count ${fromWhere(q)}`)
    return { rows, total: t?.count ?? 0 }
  })
}

/** The same row for one user of the role, or undefined (BR-3's 404). */
export async function findRequesterRow(db: Db, role: RequesterRole, userId: string): Promise<RawRequesterRow | undefined> {
  const [row] = await db.$queryRaw<RawRequesterRow[]>(selectRows({ role, userId }))
  return row
}
