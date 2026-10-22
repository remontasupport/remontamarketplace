// The tools of a chosen service that has a tool list (worker-tools U1; E2, BR-2..BR-11, BR-15..BR-17, flows 1-2). Two
// columns on the service's own worker_services row, so removing the service removes them (BR-10) with no code here.
// Read and written apart from the profile read: the deployed app parses that response strictly (BR-11).
import type { ServiceTools, ServiceToolsBody, ServiceToolsView } from '@remonta/api-contract'
import { inListOrder, normaliseOtherTools, OTHER_TOOL_MAX_CHARS, OTHER_TOOLS_MAX, SERVICE_TOOLS, TOOL_SERVICES, toolLabelOf, toolServiceOf, type ToolService } from '@remonta/schemas/data/serviceTools'
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../../platform/auth/authenticator'
import { ApiError } from '../../../../platform/errors'
import { readTransaction, type Db, type Tx } from '../../../../platform/persistence/db'
import { PROFILE_READ_STATEMENT_TIMEOUT_MS } from '../../persistence/profile-read'
import { profileNotFound } from '../own-profile'

export const TOO_MANY_OTHER_TOOLS = `Up to ${OTHER_TOOLS_MAX} other tools`
export const OTHER_TOOL_TOO_LONG = `Keep each tool under ${OTHER_TOOL_MAX_CHARS} characters`

const SERVICE_NAMES: Record<ToolService, string> = { 'cleaning-services': 'Cleaning Services', 'home-yard-maintenance': 'Home and Yard Maintenance' }

/** A stored row as the reads answer it: stale ids (a later list edit) left out (BR-9). */
export function toolsOf(categoryId: ToolService, row: { toolIds: readonly string[]; otherTools: readonly string[] }): ServiceTools {
  return { categoryId, toolIds: inListOrder(categoryId, row.toolIds), otherTools: row.otherTools.slice(0, OTHER_TOOLS_MAX) }
}

/**
 * BR-4..BR-6, pure: the row's new values from a body, or a 400 naming the field. Ids of the other list are refused,
 * not dropped (the page never sends them); the own tools are cleaned first, then held to the limits.
 */
export function toolsFromBody(categoryId: ToolService, body: ServiceToolsBody): ServiceTools {
  const foreign = body.toolIds.filter((id) => toolServiceOf(id) !== categoryId)
  if (foreign.length) {
    throw new ApiError(400, `tools of another service for ${categoryId}`, { toolIds: [`${toolLabelOf(foreign[0]!) ?? foreign[0]} is not a ${SERVICE_NAMES[categoryId]} tool`] })
  }
  const otherTools = normaliseOtherTools(body.otherTools, categoryId)
  if (otherTools.length > OTHER_TOOLS_MAX) throw new ApiError(400, 'too many other tools', { otherTools: [TOO_MANY_OTHER_TOOLS] })
  if (otherTools.some((t) => t.length > OTHER_TOOL_MAX_CHARS)) throw new ApiError(400, 'other tool too long', { otherTools: [OTHER_TOOL_TOO_LONG] })
  return { categoryId, toolIds: inListOrder(categoryId, body.toolIds), otherTools }
}

/**
 * Flow 1 (inside replaceSection's transaction): the chosen service's row replaced in both columns (BR-7); 404 when the
 * worker has not chosen the service (BR-3). The answer is what was written (BR-8).
 */
export async function writeServiceTools(tx: Tx, profileId: string, categoryId: ToolService, body: ServiceToolsBody): Promise<ServiceTools> {
  const next = toolsFromBody(categoryId, body)
  const row = await tx.workerService.findUnique({ where: { workerProfileId_categoryId: { workerProfileId: profileId, categoryId } }, select: { id: true } })
  if (!row) throw new ApiError(404, `service ${categoryId} not chosen`)
  await tx.workerService.update({ where: { id: row.id }, data: { toolIds: next.toolIds, otherTools: next.otherTools } })
  return next
}

/** Flow 2 / BR-17: one entry per chosen service that has a list, in the services' order; no profile is the 404. */
export async function readServiceTools(db: Db, principal: Principal, log: FastifyBaseLogger): Promise<ServiceToolsView> {
  const profile = await readTransaction(db, PROFILE_READ_STATEMENT_TIMEOUT_MS, (tx) =>
    tx.workerProfile.findUnique({
      where: { userId: principal.userId },
      select: {
        workerServices: {
          where: { categoryId: { in: [...TOOL_SERVICES] } },
          select: { categoryId: true, toolIds: true, otherTools: true },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    }),
  )
  if (!profile) throw profileNotFound(principal, log)
  return { services: profile.workerServices.map((r) => toolsOf(r.categoryId as ToolService, r)) }
}

/** For the admin read (BR-14): a service's tools, empty for one without a list. */
export function toolsOrEmpty(categoryId: string, row: { toolIds: readonly string[]; otherTools: readonly string[] }): Pick<ServiceTools, 'toolIds' | 'otherTools'> {
  if (!Object.hasOwn(SERVICE_TOOLS, categoryId)) return { toolIds: [], otherTools: [] }
  const t = toolsOf(categoryId as ToolService, row)
  return { toolIds: t.toolIds, otherTools: t.otherTools }
}
