import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { OPENAPI_PATH, renderOpenApi } from '../scripts/render'

describe('openapi.json (the API inventory, P7)', () => {
  it('matches the contracts -- run `pnpm --filter @remonta/api-contract openapi` and commit', async () => {
    const committed = (await readFile(OPENAPI_PATH, 'utf8')).replace(/\r\n/g, '\n')
    expect(committed).toBe(renderOpenApi())
  })

  it('describes the registration body in full, not as an empty schema', () => {
    // ts-rest's generator emitted `"schema": {}` here with Zod 4 (D1), which a drift
    // check would have accepted forever.
    const doc = JSON.parse(renderOpenApi())
    const body = doc.paths['/v1/registrations/worker'].post.requestBody.content['application/json'].schema
    expect(body.additionalProperties).toBe(false)
    expect(body.required).toEqual(expect.arrayContaining(['localityId', 'email', 'mobile', 'password', 'photoUploadId', 'captchaToken']))
    expect(body.properties.consentWordingVersion).toMatchObject({ const: 'worker-profile-share-v1' })
  })

  it('records each operation’s security metadata', () => {
    const doc = JSON.parse(renderOpenApi())
    const op = doc.paths['/v1/registrations/worker'].post
    expect(op['x-remonta-security'].bot).toEqual({ captcha: { action: 'worker_register' } })
    expect(op.security).toEqual([])
    expect(Object.keys(op.responses)).toEqual(expect.arrayContaining(['202', '400', '413', '429', '503']))
  })
})
