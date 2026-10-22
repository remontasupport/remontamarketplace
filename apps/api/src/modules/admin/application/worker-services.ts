// One worker's services for the worker's admin page (worker-tools U1, Q1 B; BR-14, flow 4): every chosen service in
// the read's order (createdAt, id), with its sub-categories and, for the services that have a tool list, the tools.
// Through Prisma, one statement; no geometry, no personal columns.
import type { AdminWorkerServices } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import type { Db } from '../../../platform/persistence/db'
import { toolsOrEmpty } from '../../worker/application/sections/service-tools'

export async function getWorkerServices(deps: { db: Db }, workerId: string): Promise<AdminWorkerServices> {
  const profile = await deps.db.workerProfile.findUnique({
    where: { id: workerId },
    select: {
      workerServices: {
        select: { categoryId: true, categoryName: true, subcategoryNames: true, toolIds: true, otherTools: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  })
  if (!profile) throw new ApiError(404, 'worker not found')
  return {
    services: profile.workerServices.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      subcategoryNames: r.subcategoryNames,
      ...toolsOrEmpty(r.categoryId, r),
    })),
  }
}
