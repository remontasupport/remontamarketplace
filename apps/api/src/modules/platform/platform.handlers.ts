import { platformContract } from '@remonta/api-contract'
import { defineHandlers } from '../../platform/contract/handlers'
import { ApiError } from '../../platform/errors'
import type { Db } from '../../platform/persistence/db'

export function platformHandlers(db: Db) {
  return defineHandlers(platformContract, {
    health: async () => {
      try {
        await db.$queryRaw`SELECT 1`
      } catch {
        throw new ApiError(503, 'database unreachable')
      }
      return { status: 200, body: { status: 'ok' } }
    },
  })
}
