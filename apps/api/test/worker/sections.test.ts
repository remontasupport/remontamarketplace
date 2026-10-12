// U2's pure pieces: the photo slot rules (R4.2-R4.4), the handler's repoint (R4.2), the
// additional-info column selection (R7.3, P7's mechanism), the bank account's stored and
// masked shapes (R6, P4), and the HTTP path through the pipeline without a database.
import { contracts, platformContract, workerContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import fc from 'fast-check'
import { afterEach, describe, expect, it } from 'vitest'
import { repoint } from '../../src/modules/registration/application/photo-process'
import { platformHandlers } from '../../src/modules/platform/platform.handlers'
import { deleteStoredPhoto, placePhoto, swapMain, withoutPhoto } from '../../src/modules/worker/application/photos'
import { columnsOf, GROUP_COLUMNS, toStoredBankAccount } from '../../src/modules/worker/application/sections/additional-info'
import { maskBankAccount } from '../../src/modules/worker/domain/bank-account'
import { workerHandlers } from '../../src/modules/worker/worker.handlers'
import type { Db } from '../../src/platform/persistence/db'
import { testApp, unreachableHandlers, workerToken, type TestApp } from '../helpers'

const A = 'https://x.public.blob.vercel-storage.com/workers/p/a.jpg'
const B = 'https://x.public.blob.vercel-storage.com/workers/p/b.jpg'
const C = 'https://x.public.blob.vercel-storage.com/workers/p/c.jpg'

describe('photo slots (R4)', () => {
  it('main replaces; additional appends up to two, then refuses', () => {
    expect(placePhoto({ main: A, additional: [] }, B, 'main')).toEqual({ main: B, additional: [] })
    expect(placePhoto({ main: A, additional: [] }, B, 'additional')).toEqual({ main: A, additional: [B] })
    expect(placePhoto({ main: A, additional: [B, C] }, 'https://n', 'additional')).toEqual({ refused: expect.stringMatching(/At most 2/) })
    expect(placePhoto({ main: null, additional: [] }, B, 'additional')).toEqual({ main: B, additional: [] }) // no main yet: it becomes the main
  })
  it('make main swaps with the main (or moves up when there is no main); only an additional photo qualifies', () => {
    expect(swapMain({ main: A, additional: [B, C] }, C)).toEqual({ main: C, additional: [B, A] })
    expect(swapMain({ main: null, additional: [B] }, B)).toEqual({ main: B, additional: [] })
    expect(swapMain({ main: A, additional: [B] }, A)).toEqual({ refused: expect.any(String) })
  })
  it('remove takes an additional photo, or the main only when it is the last one', () => {
    expect(withoutPhoto({ main: A, additional: [B, C] }, B)).toEqual({ main: A, additional: [C] })
    expect(withoutPhoto({ main: A, additional: [B] }, A)).toEqual({ refused: 'Make another photo the main photo first' })
    expect(withoutPhoto({ main: A, additional: [] }, A)).toEqual({ main: null, additional: [] })
    expect(withoutPhoto({ main: A, additional: [] }, 'https://elsewhere')).toEqual({ refused: expect.any(String) })
  })
  it('a sequence of valid operations never leaves additional photos without a main, nor more than two', () => {
    const op = fc.oneof(
      fc.record({ k: fc.constant('place' as const), url: fc.constantFrom(A, B, C), slot: fc.constantFrom('main' as const, 'additional' as const) }),
      fc.record({ k: fc.constant('swap' as const), url: fc.constantFrom(A, B, C) }),
      fc.record({ k: fc.constant('remove' as const), url: fc.constantFrom(A, B, C) }),
    )
    fc.assert(
      fc.property(fc.array(op, { maxLength: 20 }), (ops) => {
        let p: { main: string | null; additional: string[] } = { main: null, additional: [] }
        for (const o of ops) {
          const r = o.k === 'place' ? placePhoto(p, o.url, o.slot) : o.k === 'swap' ? swapMain(p, o.url) : withoutPhoto(p, o.url)
          if (!('refused' in r)) p = r
          expect(p.additional.length).toBeLessThanOrEqual(2)
          expect(p.additional.length === 0 || p.main !== null).toBe(true)
        }
      }),
    )
  })
  it('deletes a processed Blob copy and its thumbnail, never a bucket object', async () => {
    const deleted: string[] = []
    const blob = { delete: async (u: string) => void deleted.push(u) }
    await deleteStoredPhoto(blob, A, { warn: () => {} })
    await deleteStoredPhoto(blob, 'https://storage.googleapis.com/remonta-api-photos/staging/x', { warn: () => {} })
    expect(deleted).toEqual([A, A.replace('.jpg', '-256.jpg')])
  })
})

describe('the processing handler repoints the slot that holds the staged URL (R4.2)', () => {
  it('an additional slot is replaced in place; otherwise the main photo (the sign-up case)', () => {
    expect(repoint({ photos: A, additionalPhotos: JSON.stringify(['https://staged', B]) }, 'https://staged', C)).toEqual({ additionalPhotos: JSON.stringify([C, B]) })
    expect(repoint({ photos: 'https://staged', additionalPhotos: null }, 'https://staged', C)).toEqual({ photos: C })
    expect(repoint({ photos: null, additionalPhotos: null }, 'https://staged', C)).toEqual({ photos: C })
    expect(repoint({ photos: null, additionalPhotos: 'not json' }, 'https://staged', C)).toEqual({ photos: C })
  })
})

describe('additional info columns (R7.3)', () => {
  it('a group writes exactly its own columns', () => {
    expect(columnsOf({ group: 'personality', personality: 'Calm and relaxed', nonSmoker: true, petFriendly: false })).toEqual({ personality: 'Calm and relaxed', nonSmoker: true, petFriendly: false })
    expect(columnsOf({ group: 'languages', languages: ['English'] })).toEqual({ languages: ['English'] })
    const all = Object.values(GROUP_COLUMNS).flat()
    expect(new Set(all).size).toBe(all.length) // no column belongs to two groups
    expect(all).not.toContain('bankAccount')
  })
})

describe('bank account (R6, P4)', () => {
  it('stores today\'s JSON; the mask keeps three digits of each number', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{6}$/), fc.stringMatching(/^\d{6,10}$/), (bsb, accountNumber) => {
        const stored = toStoredBankAccount({ accountName: 'M', bankName: 'CBA', bsb, accountNumber })
        expect(Object.keys(stored).sort()).toEqual(['accountName', 'accountNumber', 'bankName', 'bsb'])
        const masked = JSON.stringify(maskBankAccount(stored))
        expect(masked).not.toContain(accountNumber)
        expect(masked).not.toContain(bsb)
      }),
    )
  })
})

describe('the write entries through the pipeline (no database)', () => {
  let t: TestApp | undefined
  afterEach(async () => {
    await t?.close()
    t = undefined
  })
  async function app() {
    const db = {} as Db
    t = await testApp({
      contracts,
      handlerSets: [platformHandlers({ db, clock: () => new Date(), lastSuccessAt: () => Date.now() }), workerHandlers({ db, clock: () => new Date() }), ...contracts.filter((c) => c !== platformContract && c !== workerContract).map(unreachableHandlers)],
      publicEndpoints: publicEndpoints as PublicEndpoint[],
    })
    return t
  }
  it('a bad body is 400 with the field named, before any database work', async () => {
    const a = await app()
    const res = await a.fastify.inject({ method: 'PUT', url: '/v1/worker/profile/abn', headers: workerToken('u1'), payload: { abn: '51824753557' } })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.fields).toHaveProperty('abn')
    const hours = await a.fastify.inject({ method: 'PUT', url: '/v1/worker/availability', headers: workerToken('u1'), payload: { slots: [{ day: 'MONDAY', startMinute: 600, endMinute: 540 }] } })
    expect(hours.statusCode).toBe(400)
    expect(Object.keys(hours.json().error.fields)).toContain('slots.0.startMinute')
  })
  it('the group in the path and the body must agree on the parse (an unknown group is 400)', async () => {
    const a = await app()
    const res = await a.fastify.inject({ method: 'PUT', url: '/v1/worker/additional-info/nope', headers: workerToken('u1'), payload: { group: 'nope' } })
    expect(res.statusCode).toBe(400)
  })
  it('another role is 403; no token is 401', async () => {
    const a = await app()
    expect((await a.fastify.inject({ method: 'PUT', url: '/v1/worker/profile/bio', headers: { 'x-test-principal': 'u1:ADMIN' }, payload: { bio: 'x' } })).statusCode).toBe(403)
    expect((await a.fastify.inject({ method: 'PUT', url: '/v1/worker/profile/bio', payload: { bio: 'x' } })).statusCode).toBe(401)
  })
})
