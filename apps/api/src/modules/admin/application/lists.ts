// The two other admin lists (U2, functional design L7; rules R9, R10): today's
// behaviour behind the contract, through Prisma (no geometry here).
import type { SuspendedListResponse, UserListResponse, WorkerRow } from '@remonta/api-contract'
import type { Clock } from '../../../platform/clock'
import type { Db } from '../../../platform/persistence/db'
import { shapeRow } from './search-workers'

const NAME = (search: string) => ({ contains: search, mode: 'insensitive' as const })

/** R9: the impersonation picker -- email or any profile name, newest first, 50 at most. */
export async function listUsers(deps: { db: Db }, query: { search: string; role?: string }): Promise<UserListResponse> {
  const s = query.search.trim()
  const users = await deps.db.user.findMany({
    where: {
      OR: [
        { email: NAME(s) },
        { workerProfile: { firstName: NAME(s) } },
        { workerProfile: { lastName: NAME(s) } },
        { clientProfile: { firstName: NAME(s) } },
        { clientProfile: { lastName: NAME(s) } },
        { coordinatorProfile: { firstName: NAME(s) } },
        { coordinatorProfile: { lastName: NAME(s) } },
      ],
      ...(query.role ? { role: query.role as never } : {}),
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      workerProfile: { select: { firstName: true, lastName: true, mobile: true } },
      clientProfile: { select: { firstName: true, lastName: true, mobile: true } },
      coordinatorProfile: { select: { firstName: true, lastName: true, mobile: true } },
    },
    take: 50,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  })
  return {
    users: users.map((u) => {
      const profile = u.workerProfile ?? u.clientProfile ?? u.coordinatorProfile
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        ...(profile?.firstName ? { firstName: profile.firstName } : {}),
        ...(profile?.lastName ? { lastName: profile.lastName } : {}),
        ...(profile?.mobile ? { mobile: profile.mobile } : {}),
      }
    }),
  }
}

/** R10: suspended workers, most recently changed first, paged; the same row shape as the search. */
export async function listSuspendedWorkers(deps: { db: Db; clock: Clock }, query: { page: number; pageSize: number }): Promise<SuspendedListResponse> {
  const where = { user: { status: 'SUSPENDED' as const } }
  const skip = (query.page - 1) * query.pageSize
  const [total, workers] = await Promise.all([
    deps.db.workerProfile.count({ where }),
    deps.db.workerProfile.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        age: true,
        dateOfBirth: true,
        languages: true,
        city: true,
        state: true,
        postalCode: true,
        photos: true,
        experience: true,
        introduction: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true, status: true } },
        workerAdditionalInfo: { select: { languages: true } },
        workerServices: { select: { categoryId: true, categoryName: true } },
        locations: { where: { kind: 'HOME' }, select: { precision: true, travelRadiusKm: true, locality: { select: { suburb: true, state: true, postcode: true } } }, take: 1 },
      },
    }),
  ])
  const now = deps.clock()
  const data: WorkerRow[] = workers.map((w) => {
    const home = w.locations[0]
    return shapeRow(
      {
        ...w,
        email: w.user.email,
        userStatus: w.user.status,
        infoLanguages: w.workerAdditionalInfo?.languages ?? null,
        serviceNames: [...new Set(w.workerServices.map((s) => s.categoryName))],
        serviceIds: [...new Set(w.workerServices.map((s) => s.categoryId))],
        homeSuburb: home?.locality.suburb ?? null,
        homeState: home?.locality.state ?? null,
        homePostcode: home?.locality.postcode ?? null,
        precision: home?.precision ?? null,
        travelRadiusKm: home?.travelRadiusKm ?? null,
        distance_m: null,
        total,
      },
      now,
      false,
    )
  })
  const totalPages = Math.ceil(total / query.pageSize)
  return { data, pagination: { total, page: query.page, pageSize: query.pageSize, totalPages, hasNext: query.page < totalPages, hasPrev: query.page > 1 } }
}
