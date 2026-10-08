// A synthetic role-restricted contract for the pipeline's 401/403 proofs. It runs
// through exactly the same binder and pipeline as the real contracts.
import { defineContract, meta } from '@remonta/api-contract'
import * as z from 'zod'

export const privateContract = defineContract('testPrivate', {
  adminThing: {
    method: 'POST',
    path: '/v1/test/admin-thing/:thingId',
    summary: 'test only',
    pathParams: z.strictObject({ thingId: z.string().max(10) }),
    body: { kind: 'json', schema: z.strictObject({ name: z.string().max(20) }) },
    responses: { 200: z.strictObject({ ok: z.literal(true) }) },
    meta: meta({
      access: { roles: ['ADMIN'] },
      bot: 'none',
      rateLimit: [{ per: 'ip', limit: 10, window: '1m' }, { per: 'user', limit: 5, window: '1m' }],
      maxBodyKb: 1,
    }),
  },
})
