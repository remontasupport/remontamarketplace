// The ticket is a V4 signed POST policy (AD-1). Signed offline with a throwaway key
// generated here (never committed, never a real account), then decoded: the policy
// must name exactly the key, the type, the size range and the expiry the api asked
// for (round-trip property). The fake server cannot prove this, since it ignores
// signatures; staging proves the browser's form POST against a real bucket.
import { generateKeyPairSync } from 'node:crypto'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { GcsPhotoStore } from '../../src/modules/registration/adapters/gcs-photo-store'
import { declaredType, uuid } from './generators'

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const credentials = { client_email: 'throwaway@test-project.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) as string }

const store = new GcsPhotoStore({ bucket: 'test-photos', publicBaseUrl: 'http://localhost:4443/test-photos', apiEndpoint: 'http://localhost:4443', credentials, timeoutMs: 5000 })

type Condition = Record<string, string> | [string, string, string] | [string, number, number]

describe('GcsPhotoStore.createUploadTicket', () => {
  it('produces a policy bound to the key, the content type, the size range and the expiry (round-trip)', async () => {
    await fc.assert(
      fc.asyncProperty(uuid, declaredType, fc.integer({ min: 1, max: 5 * 1024 * 1024 }), fc.integer({ min: 60, max: 7 * 24 * 3600 - 60 }), async (id, type, maxBytes, ttlS) => {
        const key = `staging/${id}`
        const expiresAt = new Date(Date.now() + ttlS * 1000)
        const t = await store.createUploadTicket(key, type, maxBytes, expiresAt)
        // Against the real service the SDK returns `https://storage.googleapis.com/<bucket>/`; with an endpoint override it returns the endpoint.
        expect(t.url.startsWith('http://localhost:4443')).toBe(true)
        expect(t.fields.key).toBe(key)
        expect(t.fields['Content-Type']).toBe(type)
        expect(t.fields.success_action_status).toBe('201')
        expect(t.fields['x-goog-signature']).toMatch(/^[0-9a-f]+$/)
        const policy = JSON.parse(Buffer.from(t.fields.policy!, 'base64').toString('utf8')) as { expiration: string; conditions: Condition[] }
        // The policy expiry is the one asked for, to the second.
        expect(Math.abs(new Date(policy.expiration).getTime() - expiresAt.getTime())).toBeLessThan(1000)
        const has = (pred: (c: Condition) => boolean) => policy.conditions.some(pred)
        expect(has((c) => !Array.isArray(c) && c.key === key)).toBe(true)
        expect(has((c) => Array.isArray(c) && c[0] === 'eq' && c[1] === '$Content-Type' && c[2] === type)).toBe(true)
        expect(has((c) => Array.isArray(c) && c[0] === 'content-length-range' && c[1] === 1 && c[2] === maxBytes)).toBe(true)
        expect(has((c) => !Array.isArray(c) && c['Content-Type'] === type)).toBe(true)
        // No other key may be filled with this policy.
        expect(policy.conditions.filter((c) => !Array.isArray(c) && 'key' in c)).toHaveLength(1)
      }),
      { numRuns: 15 },
    )
  })
})
