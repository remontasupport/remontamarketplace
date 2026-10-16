// U2's pure pieces: the one-photo rule (R4.4), the handler's repoint (R4.2), the
// additional-info column selection (R7.3, P7's mechanism), the bank account's stored and
// masked shapes (R6, P4), and the HTTP path through the pipeline without a database.
import { ADDITIONAL_INFO_ENTRIES, contracts, platformContract, workerContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import fc from 'fast-check'
import { afterEach, describe, expect, it } from 'vitest'
import { repoint } from '../../src/modules/registration/application/photo-process'
import { platformHandlers } from '../../src/modules/platform/platform.handlers'
import { deleteStoredPhoto, isBlobUrl, withoutPhoto } from '../../src/modules/worker/application/photos'
import { columnsOf, GROUP_COLUMNS, toStoredBankAccount } from '../../src/modules/worker/application/sections/additional-info'
import { maskBankAccount } from '../../src/modules/worker/domain/bank-account'
import { workerHandlers } from '../../src/modules/worker/worker.handlers'
import type { Db } from '../../src/platform/persistence/db'
import { testApp, unreachableHandlers, workerToken, type TestApp } from '../helpers'

const A = 'https://x.public.blob.vercel-storage.com/workers/p/a.jpg'
const B = 'https://x.public.blob.vercel-storage.com/workers/p/b.jpg'
const C = 'https://x.public.blob.vercel-storage.com/workers/p/c.jpg'
const OWNER = 'cmowner0000000000000000a'
const OTHER = 'cmother0000000000000000b'
const UPLOAD = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'
const OWN = `https://x.public.blob.vercel-storage.com/workers/${OWNER}/${UPLOAD}.jpg`

describe('one photo (R4; user 2026-10-14: no additional photos)', () => {
  it("remove takes the photo only when it is the worker's own", () => {
    expect(withoutPhoto({ main: A }, A)).toEqual({ main: null })
    expect(withoutPhoto({ main: A }, B)).toEqual({ refused: expect.any(String) })
    expect(withoutPhoto({ main: null }, A)).toEqual({ refused: expect.any(String) })
  })
  it('any sequence of removes leaves the photo or nothing, never another URL', () => {
    fc.assert(
      fc.property(fc.constantFrom<string | null>(A, null), fc.array(fc.constantFrom(A, B, C), { maxLength: 10 }), (start, urls) => {
        let p = { main: start }
        for (const u of urls) {
          const r = withoutPhoto(p, u)
          if (!('refused' in r)) p = r
          expect([start, null]).toContain(p.main)
        }
      }),
    )
  })
  it('recognises Blob URLs by their parsed host only (CodeQL: no unanchored match)', () => {
    expect(isBlobUrl(A)).toBe(true)
    expect(isBlobUrl('https://evil.example/x.public.blob.vercel-storage.com/a.jpg')).toBe(false)
    expect(isBlobUrl('https://x.public.blob.vercel-storage.com.evil.example/a.jpg')).toBe(false)
    expect(isBlobUrl('http://x.public.blob.vercel-storage.com/a.jpg')).toBe(false)
    expect(isBlobUrl('not a url')).toBe(false)
  })

  it('deletes a processed Blob copy and its thumbnail, never a bucket object', async () => {
    const deleted: string[] = []
    const blob = { delete: async (u: string) => void deleted.push(u) }
    await deleteStoredPhoto(blob, OWN, OWNER, { warn: () => {} })
    await deleteStoredPhoto(blob, 'https://storage.googleapis.com/remonta-api-photos/staging/x', OWNER, { warn: () => {} })
    expect(deleted).toEqual([OWN, OWN.replace('.jpg', '-256.jpg')])
  })

  // F1 (api-review 2026-10-14): a URL in the caller's columns is not proof the file is theirs -- the legacy
  // `updateWorkerPhoto` action stores any URL. Only the caller's own folder, `workers/<their profile id>/<upload id>`, is deleted.
  it("never deletes another worker's file, or one outside the api's own keys", async () => {
    const deleted: string[] = []
    const blob = { delete: async (u: string) => void deleted.push(u) }
    const others = [
      `https://x.public.blob.vercel-storage.com/workers/${OTHER}/${UPLOAD}.jpg`, // another worker's photo
      `https://x.public.blob.vercel-storage.com/workers/${OTHER}/${UPLOAD}-256.jpg`,
      `https://x.public.blob.vercel-storage.com/workers/${OWNER}/../${OTHER}/${UPLOAD}.jpg`, // dot segments
      `https://x.public.blob.vercel-storage.com/workers/${OWNER}%2F..%2F${OTHER}/${UPLOAD}.jpg`, // encoded
      `https://x.public.blob.vercel-storage.com/workers/${OWNER}/${UPLOAD}/x.jpg`, // deeper
      `https://x.public.blob.vercel-storage.com/workers/${OWNER}/not-an-id.jpg`,
      `https://x.public.blob.vercel-storage.com/workers/registration/${UPLOAD}.jpg`, // the multipart era
      'https://x.public.blob.vercel-storage.com/workers/john/photo-123.jpg', // the app's legacy uploads
      `https://x.public.blob.vercel-storage.com/workers/${OWNER}/${UPLOAD}.jpg?x=1`,
    ]
    for (const url of others) await deleteStoredPhoto(blob, url, OWNER, { warn: () => {} })
    expect(deleted).toEqual([])
  })

  it('deletes a stored-as-uploaded copy (no thumbnail) in the owner\'s folder', async () => {
    const deleted: string[] = []
    const blob = { delete: async (u: string) => void deleted.push(u) }
    const png = `https://x.public.blob.vercel-storage.com/workers/${OWNER}/${UPLOAD}.png`
    await deleteStoredPhoto(blob, png, OWNER, { warn: () => {} })
    expect(deleted).toEqual([png])
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
    expect(columnsOf('personality', { personality: 'Calm and relaxed', nonSmoker: true, petFriendly: false })).toEqual({ personality: 'Calm and relaxed', nonSmoker: true, petFriendly: false })
    expect(columnsOf('languages', { languages: ['English'] })).toEqual({ languages: ['English'] })
    expect(columnsOf('fun-fact', { funFact: 'f'.repeat(50) })).toEqual({ funFact: 'f'.repeat(50) }) // the activities are untouched (2026-10-13)
    expect(columnsOf('support-activities', { uniqueService: ['Fishing trips'] })).toEqual({ uniqueService: ['Fishing trips'] })
    expect(columnsOf('religion', { religion: ['Buddhist'], languages: ['English'] })).toEqual({ religion: ['Buddhist'] }) // another group's column never passes
    expect(Object.keys(GROUP_COLUMNS).sort()).toEqual(Object.keys(ADDITIONAL_INFO_ENTRIES).sort()) // a column list per entry
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
  it("each group is its own entry (2026-10-14): another group's field is 400, the old group field is refused, an unknown group is 404", async () => {
    const a = await app()
    const put = (url: string, payload: object) => a.fastify.inject({ method: 'PUT', url, headers: workerToken('u1'), payload })
    expect((await put('/v1/worker/additional-info/religion', { languages: ['English'] })).statusCode).toBe(400)
    expect((await put('/v1/worker/additional-info/religion', { group: 'religion', religion: ['Buddhist'] })).statusCode).toBe(400)
    expect((await put('/v1/worker/additional-info/nope', {})).statusCode).toBe(404)
    expect((await put('/v1/worker/additional-info/about-me', { uniqueService: ['Fishing trips'] })).statusCode).toBe(404)
  })
  it('deleting an education row takes a row id in the address and no body (2026-10-14)', async () => {
    const a = await app()
    const del = (url: string, payload?: object) => a.fastify.inject({ method: 'DELETE', url, headers: workerToken('u1'), ...(payload ? { payload } : {}) })
    expect((await del('/v1/worker/education/' + encodeURIComponent('../x'))).statusCode).toBe(400)
    expect((await del('/v1/worker/education/cm123', { entryId: 'cm999' })).statusCode).toBe(400) // no body
    expect((await a.fastify.inject({ method: 'DELETE', url: '/v1/worker/education/cm123' })).statusCode).toBe(401) // no token
  })
  it('deleting a work-history row takes a row id in the address and no body (2026-10-14)', async () => {
    const a = await app()
    const del = (url: string, payload?: object) => a.fastify.inject({ method: 'DELETE', url, headers: workerToken('u1'), ...(payload ? { payload } : {}) })
    expect((await del('/v1/worker/job-history/' + encodeURIComponent("x' OR 1=1"))).statusCode).toBe(400)
    expect((await del('/v1/worker/job-history/' + 'a'.repeat(41))).statusCode).toBe(400)
    expect((await del('/v1/worker/job-history/cm123', { id: 'cm999' })).statusCode).toBe(400) // no body
    expect((await a.fastify.inject({ method: 'DELETE', url: '/v1/worker/job-history/cm123' })).statusCode).toBe(401) // no token
  })
  it('deleting an experience area takes a known care domain in the address and no body (2026-10-14)', async () => {
    const a = await app()
    const del = (url: string, payload?: object) => a.fastify.inject({ method: 'DELETE', url, headers: workerToken('u1'), ...(payload ? { payload } : {}) })
    expect((await del('/v1/worker/experience/NOPE')).statusCode).toBe(400)
    expect((await del('/v1/worker/experience/disability')).statusCode).toBe(400) // the enum value, exactly
    expect((await del('/v1/worker/experience/DISABILITY', { domain: 'AGED_CARE' })).statusCode).toBe(400) // no body
    expect((await a.fastify.inject({ method: 'DELETE', url: '/v1/worker/experience/DISABILITY' })).statusCode).toBe(401) // no token
  })
  it('the date of birth, gender and vehicle writes take their own answer only; the combined personal-info write is gone (2026-10-14)', async () => {
    const a = await app()
    const put = (url: string, payload: object) => a.fastify.inject({ method: 'PUT', url, headers: workerToken('u1'), payload })
    expect((await put('/v1/worker/profile/gender', { gender: 'Male', hasVehicle: 'Yes' })).statusCode).toBe(400)
    expect((await put('/v1/worker/profile/vehicle', { hasVehicle: 'Yes', dateOfBirth: '1990-01-01' })).statusCode).toBe(400)
    const dob = await put('/v1/worker/profile/date-of-birth', { dateOfBirth: '2020-01-01' })
    expect(dob.statusCode).toBe(400)
    expect(dob.json().error.fields).toHaveProperty('dateOfBirth')
    expect((await put('/v1/worker/profile/personal-info', { dateOfBirth: '1990-01-01', gender: 'Male', hasVehicle: 'Yes' })).statusCode).toBe(404)
  })
  it('another role is 403; no token is 401', async () => {
    const a = await app()
    expect((await a.fastify.inject({ method: 'PUT', url: '/v1/worker/profile/bio', headers: { 'x-test-principal': 'u1:ADMIN' }, payload: { bio: 'x' } })).statusCode).toBe(403)
    expect((await a.fastify.inject({ method: 'PUT', url: '/v1/worker/profile/bio', payload: { bio: 'x' } })).statusCode).toBe(401)
  })
})
