// admin-clients U1: clients and coordinators for the admin (functional design BR-1..BR-9). One implementation for both
// roles (CS-1): the role picks the profile table in requester-sql.ts and nothing else differs.
import type { AdminParticipant, RequesterDetail, RequesterListQueryParsed, RequesterListResponse, RequesterRole, RequesterRow, RequestStatus } from '@remonta/api-contract'
import type { ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'
import type { AuditRecorder } from '../../../platform/audit'
import type { Clock } from '../../../platform/clock'
import { ApiError } from '../../../platform/errors'
import { enqueue } from '../../../platform/outbox/outbox'
import { unitOfWork, type Db } from '../../../platform/persistence/db'
import { SERVICE_REQUEST_STATUS_CHANGED, type ServiceRequestStatusChangedPayload } from '../domain/events'
import { paginationOf } from '../domain/pagination'
import { findRequesterRow, runRequesterList, type RawRequesterRow } from '../persistence/requester-sql'

const isRequesterRole = (role: string): role is RequesterRole => role === 'CLIENT' || role === 'COORDINATOR'

function shapeRequester(r: RawRequesterRow): RequesterRow {
  return {
    userId: r.userId,
    role: r.role,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    mobile: r.mobile,
    ...(r.organisation ? { organisation: r.organisation } : {}),
    participantCount: r.participantCount,
    requestCount: r.requestCount,
  }
}

/** BR-1, BR-2. */
export async function listRequesters(deps: { db: Db }, query: RequesterListQueryParsed): Promise<RequesterListResponse> {
  const { rows, total } = await runRequesterList(deps.db, query)
  return { data: rows.map(shapeRequester), pagination: paginationOf(total, query.page, query.pageSize) }
}

/** assignedWorker holds worker user ids (the client's selection); resolved to profiles in one query. */
async function workersByUserId(db: Db, userIds: string[]): Promise<Map<string, { workerProfileId: string; name: string }>> {
  if (userIds.length === 0) return new Map()
  const profiles = await db.workerProfile.findMany({ where: { userId: { in: userIds } }, select: { id: true, userId: true, firstName: true, lastName: true } })
  return new Map(profiles.map((p) => [p.userId, { workerProfileId: p.id, name: `${p.firstName} ${p.lastName}`.trim() }]))
}

const userIdsOf = (assigned: unknown): string[] => (Array.isArray(assigned) ? assigned.filter((v): v is string => typeof v === 'string') : [])

/** BR-3, BR-9: the profile, owned participants newest first, each with its requests newest first; the view is audited. */
export async function getRequester(deps: { db: Db }, audit: AuditRecorder, adminUserId: string, userId: string): Promise<RequesterDetail> {
  const user = await deps.db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const row = user && isRequesterRole(user.role) ? await findRequesterRow(deps.db, user.role, userId) : undefined
  if (!row) throw new ApiError(404, 'client or coordinator not found')

  const participants = await deps.db.participant.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: { serviceRequests: { orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] } },
  })
  const workers = await workersByUserId(deps.db, [...new Set(participants.flatMap((p) => p.serviceRequests.flatMap((r) => userIdsOf(r.assignedWorker))))])

  const shaped: AdminParticipant[] = participants.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
    location: p.location,
    gender: p.gender,
    conditions: p.conditions,
    fundingType: p.fundingType,
    relationshipToClient: p.relationshipToClient,
    isSelfManaged: p.isSelfManaged,
    servicesRequested: (p.servicesRequested ?? null) as AdminParticipant['servicesRequested'],
    additionalInfo: p.additionalInfo,
    createdAt: p.createdAt.toISOString(),
    requests: p.serviceRequests.map((r) => ({
      id: r.id,
      status: r.status,
      // The stored JSON is the client's own request (createServiceRequestSchema); the pipeline parses it against the
      // contract, which reuses that schema, before it leaves.
      services: r.services as never,
      details: r.details as never,
      location: r.location,
      assignedWorkers: userIdsOf(r.assignedWorker).flatMap((id) => workers.get(id) ?? []),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  }))

  await audit.record(deps.db, { action: 'ADMIN_RECORD_VIEW', userId: adminUserId, metadata: { requesterUserId: userId } })
  return { requester: shapeRequester(row), participants: shaped }
}

/**
 * BR-7: any status from any status. A repeat writes nothing; a change writes the row, its audit and the n8n event in one
 * transaction. The update is conditional on the status read, so a change made meanwhile answers 409 instead of being
 * overwritten unseen.
 */
export async function setRequestStatus(deps: { db: Db; clock: Clock }, audit: AuditRecorder, adminUserId: string, requestId: string, status: ServiceRequestStatus): Promise<RequestStatus> {
  return unitOfWork(deps.db, async (tx) => {
    const row = await tx.serviceRequest.findUnique({ where: { id: requestId }, select: { status: true } })
    if (!row) throw new ApiError(404, 'service request not found')
    if (row.status === status) {
      audit.skip('the same status')
      return { requestId, status }
    }
    const { count } = await tx.serviceRequest.updateMany({
      where: { id: requestId, status: row.status },
      // As the client's own cancel: a cancelled request keeps no selected workers.
      data: { status, ...(status === 'CANCELLED' ? { selectedWorkers: [] } : {}) },
    })
    if (count === 0) throw new ApiError(409, 'the request changed meanwhile; reload it')
    await audit.record(tx, { action: 'SERVICE_REQUEST_STATUS_CHANGE', userId: adminUserId, metadata: { requestId, from: row.status, to: status } })
    const payload: ServiceRequestStatusChangedPayload = { serviceRequestId: requestId, adminUserId }
    await enqueue(tx, { type: SERVICE_REQUEST_STATUS_CHANGED, payload }, deps.clock())
    return { requestId, status }
  })
}
