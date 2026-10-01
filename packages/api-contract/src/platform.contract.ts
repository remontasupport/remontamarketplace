// Platform: the service's own endpoints. Even the health check is a contract entry,
// so it passes the same pipeline and appears in the inventory.
import * as z from 'zod'
import { defineContract } from './define'
import { meta } from './meta'

export const platformContract = defineContract('platform', {
  health: {
    method: 'GET',
    path: '/v1/health',
    summary: 'Liveness: the process is up and its database answers.',
    responses: { 200: z.strictObject({ status: z.literal('ok') }) },
    meta: meta({
      access: 'public',
      bot: 'none',
      rateLimit: [{ per: 'ip', limit: 60, window: '1m' }],
      maxBodyKb: 1,
      probe: true,
    }),
  },
})
