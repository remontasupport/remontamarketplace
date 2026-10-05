// fast-check arbitraries for the sign-up photo tests (PBT-07: domain generators, reused).
import { randomUUID } from 'node:crypto'
import * as fc from 'fast-check'

export const uuid = fc.uuid({ version: 4 })
export const profileId = fc.stringMatching(/^[A-Za-z0-9_-]{1,32}$/)

const JPEG = [0xff, 0xd8, 0xff]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const WEBP = [...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0)))
const HEIC = [0, 0, 0, 0x18, ...'ftypheic'].map((c) => (typeof c === 'number' ? c : c.charCodeAt(0)))

/** A 16+ byte header of a known kind, or junk. */
export const header = fc.oneof(
  fc.record({ type: fc.constant('image/jpeg' as const), bytes: fc.constant(JPEG) }),
  fc.record({ type: fc.constant('image/png' as const), bytes: fc.constant(PNG) }),
  fc.record({ type: fc.constant('image/webp' as const), bytes: fc.constant(WEBP) }),
  fc.record({ type: fc.constant('image/heic' as const), bytes: fc.constant(HEIC) }),
  fc.record({ type: fc.constant(null), bytes: fc.constant([0x3c, 0x73, 0x76, 0x67]) }),
).map(({ type, bytes }) => ({ type, bytes: Buffer.from([...bytes, ...new Array(Math.max(0, 20 - bytes.length)).fill(0)]) }))

export const declaredType = fc.constantFrom('image/jpeg', 'image/png', 'image/webp')

/** The confirm decision inputs (business rule R2). */
export const confirmCase = fc.record({
  rowExists: fc.boolean(),
  objectPresent: fc.boolean(),
  sizeBytes: fc.oneof(fc.integer({ min: 1, max: 5 * 1024 * 1024 }), fc.integer({ min: 5 * 1024 * 1024 + 1, max: 6 * 1024 * 1024 })),
  header,
  objectContentType: declaredType,
})

/** A purge candidate set: rows of mixed age, claim state and store. */
export const purgeRow = fc.record({
  id: fc.constant(null).map(() => randomUUID()),
  hoursAgo: fc.integer({ min: 0, max: 72 }),
  claimed: fc.boolean(),
  store: fc.constantFrom('gcs', 'vercel-blob'),
})

/** A scripted sequence of outcomes for the engine's uploader / confirm, used by the budget property in the engine package too. */
export const failureScript = fc.array(fc.constantFrom('ok', 'network', 'storage-5xx', 'policy-403', 'confirm-409', 'confirm-503'), { minLength: 0, maxLength: 12 })
