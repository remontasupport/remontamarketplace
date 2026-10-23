// The extra photos (2026-10-23): their own entries, so the main photo's answers keep the shape the deployed app parses.
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { adminContract, MAX_ADDITIONAL_PHOTOS, photosSchema, workerContract, workerPhotosSchema } from '../src'

const js = (s: z.ZodType) => z.toJSONSchema(s, { io: 'output', unrepresentable: 'any' })

describe('the extra photos', () => {
  it('the main photo entries still answer {main} only (the deployed app parses them strictly)', () => {
    expect(js(photosSchema)).toEqual({ $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', properties: { main: { anyOf: [{ type: 'string', maxLength: 2048 }, { type: 'null' }] } }, required: ['main'], additionalProperties: false })
    for (const n of ['confirmPhoto', 'removePhoto'] as const) expect(workerContract.entries[n].responses).toHaveProperty('201' in workerContract.entries[n].responses ? '201' : '200', photosSchema)
  })

  it('the worker entries, paths and access; none for admins (removed 2026-10-23)', () => {
    expect(workerContract.entries.getPhotos).toMatchObject({ method: 'GET', path: '/v1/worker/photos' })
    expect(workerContract.entries.addAdditionalPhoto).toMatchObject({ method: 'POST', path: '/v1/worker/photos/additional' })
    expect(workerContract.entries.removeAdditionalPhoto).toMatchObject({ method: 'POST', path: '/v1/worker/photos/additional/remove' })
    expect(Object.values(adminContract.entries).some((e) => e.path.includes('photo'))).toBe(false)
    for (const n of ['getPhotos', 'addAdditionalPhoto', 'removeAdditionalPhoto'] as const) expect(workerContract.entries[n].meta.access).toEqual({ roles: ['WORKER'] })
  })

  it('the read takes up to 10 stored extra photos; the limit for adding is 2', () => {
    expect(MAX_ADDITIONAL_PHOTOS).toBe(2)
    expect(workerPhotosSchema.safeParse({ main: null, additional: [] }).success).toBe(true)
    expect(workerPhotosSchema.safeParse({ main: 'https://x.test/a.jpg', additional: Array(10).fill('https://x.test/b.jpg') }).success).toBe(true)
    expect(workerPhotosSchema.safeParse({ main: null, additional: Array(11).fill('u') }).success).toBe(false)
    expect(workerPhotosSchema.safeParse({ main: null }).success).toBe(false)
  })
})
