// worker-activation U1: the activation filter (BR-5), the row's `activated` on request only (BR-6, N1) and the two
// switches (BR-1..BR-4, BR-7, BR-8) with a fake database; the database-gated half is activation.int.test.ts.
import { workerRowSchema, workerSearchQuerySchema } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { activeFilters, whereOf } from '../../src/modules/admin/application/filters'
import { shapeRow } from '../../src/modules/admin/application/search-workers'
import { setWorkerActivation, setWorkerSuspension } from '../../src/modules/admin/application/worker-status'
import { appliedFiltersOf, normaliseQuery } from '../../src/modules/admin/domain/search-query'
import type { RawWorkerRow } from '../../src/modules/admin/persistence/worker-search-sql'
import type { Db } from '../../src/platform/persistence/db'
import { ApiError } from '../../src/platform/errors'

const NOW = new Date('2026-10-23T00:00:00Z')
const q = (raw: Record<string, unknown>) => normaliseQuery(workerSearchQuerySchema.parse(raw), NOW)
const text = (s: { strings: readonly string[]; values: readonly unknown[] }) => s.strings.map((part, i) => part + (i < s.values.length ? `<${JSON.stringify(s.values[i])}>` : '')).join('')

describe('the activation filter (BR-5)', () => {
  it('active and inactive bind the flag; absent adds nothing', () => {
    expect(text(whereOf(q({ activation: 'active' })))).toContain('p."isActivated" = <true>')
    expect(text(whereOf(q({ activation: 'inactive' })))).toContain('p."isActivated" = <false>')
    expect(text(whereOf(q({})))).not.toContain('isActivated')
    expect(activeFilters(q({ activation: 'inactive', unplaced: 'true' }))).toEqual(['activation'])
  })

  it('always together with the not-suspended base condition', () => {
    expect(text(whereOf(q({ activation: 'active' })))).toMatch(/^u\.status = 'ACTIVE' AND \(p\."isActivated" = <true>\)$/)
  })

  it('P5: echoed in appliedFilters exactly when given', () => {
    fc.assert(
      fc.property(fc.constantFrom(undefined, 'active', 'inactive'), fc.boolean(), (activation, withActivation) => {
        const applied = appliedFiltersOf(q({ ...(activation ? { activation } : {}), withActivation: String(withActivation) }))
        if (activation) expect(applied.activation).toBe(activation)
        else expect(applied).not.toHaveProperty('activation')
        expect(applied).not.toHaveProperty('withActivation')
      }),
    )
  })
})

const raw = (patch: Partial<RawWorkerRow> = {}): RawWorkerRow => ({
  id: 'w1', userId: 'u1', firstName: 'Ann', lastName: 'Lee', mobile: '0400000000', gender: 'Female', age: 40, dateOfBirth: null,
  languages: [], city: null, state: null, postalCode: null, photos: null, experience: null, introduction: null,
  createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-02T00:00:00Z'), email: 'ann@example.test',
  userStatus: 'ACTIVE', infoLanguages: null, serviceNames: null, serviceIds: null, homeSuburb: null, homeState: null,
  homePostcode: null, precision: null, travelRadiusKm: null, distance_m: null, total: 1, ...patch,
})

/** Today's row schema (main 8943f93): strict, no `activated`. */
const todaysRow = workerRowSchema.omit({ activated: true }).strict()

describe('the row (BR-6, N1)', () => {
  it('P2 (unit): `activated` iff asked, equal to the column; without it the row is the one parsed today', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.option(fc.boolean(), { nil: undefined }), fc.constantFrom('ACTIVE', 'SUSPENDED'), (ask, activated, userStatus) => {
        const row = shapeRow(raw({ activated, userStatus }), NOW, false, ask)
        expect(workerRowSchema.safeParse(row).success).toBe(true)
        if (ask) expect(row.activated).toBe(activated === true)
        else {
          expect(row).not.toHaveProperty('activated')
          expect(todaysRow.safeParse(row).success).toBe(true)
        }
        expect(row.isActive).toBe(userStatus === 'ACTIVE')
      }),
    )
  })
})

interface FakeState {
  profile?: { id: string; userId: string; isActivated: boolean }
  user?: { role: string; status: string; updatedAt?: Date }
}

/** A fake db holding one worker profile and its user. */
function fakeDb(state: FakeState) {
  const writes: string[] = []
  const db = {
    workerProfile: {
      updateMany: async ({ where, data }: { where: { id: string }; data: { isActivated: boolean } }) => {
        if (state.profile?.id !== where.id) return { count: 0 }
        state.profile.isActivated = data.isActivated
        writes.push('profile')
        return { count: 1 }
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.profile?.id === where.id && state.user ? { userId: state.profile.userId, user: { role: state.user.role, status: state.user.status } } : null,
    },
    user: {
      update: async ({ data }: { data: { status: string; updatedAt: Date } }) => {
        Object.assign(state.user!, data)
        writes.push('user')
        return { id: state.profile!.userId }
      },
    },
  }
  return { db: db as unknown as Db, writes }
}

const is404 = (e: unknown) => e instanceof ApiError && e.status === 404

describe('setWorkerActivation (BR-1..BR-4)', () => {
  it('writes the flag and answers it; a repeat answers the same', async () => {
    const state = { profile: { id: 'p1', userId: 'u1', isActivated: false }, user: { role: 'WORKER', status: 'SUSPENDED' } }
    const { db } = fakeDb(state)
    await expect(setWorkerActivation({ db }, 'p1', true)).resolves.toEqual({ workerId: 'p1', activated: true })
    await expect(setWorkerActivation({ db }, 'p1', true)).resolves.toEqual({ workerId: 'p1', activated: true })
    expect(state.profile.isActivated).toBe(true)
    expect(state.user.status).toBe('SUSPENDED') // BR-3: a suspended worker can be switched; the account is untouched
  })

  it('404 for an unknown worker', async () => {
    const { db, writes } = fakeDb({})
    await expect(setWorkerActivation({ db }, 'nope', true)).rejects.toSatisfy(is404)
    expect(writes).toEqual([])
  })
})

describe('setWorkerSuspension (BR-7, BR-8)', () => {
  const clock = () => NOW

  it('P4 (unit): any sequence ends at the last write; the flag never moves; no write when unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.constantFrom('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION'),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 6 }),
        async (activated, start, seq) => {
          const state = { profile: { id: 'p1', userId: 'u1', isActivated: activated }, user: { role: 'WORKER', status: start } }
          const { db, writes } = fakeDb(state)
          let expectedWrites = 0
          let current = start
          for (const suspended of seq) {
            const target = suspended ? 'SUSPENDED' : 'ACTIVE'
            if (current !== target) expectedWrites++
            current = target
            await expect(setWorkerSuspension({ db, clock }, 'p1', suspended)).resolves.toEqual({ workerId: 'p1', suspended })
          }
          expect(state.user.status).toBe(seq.at(-1) ? 'SUSPENDED' : 'ACTIVE')
          expect(state.profile.isActivated).toBe(activated)
          expect(writes.length).toBe(expectedWrites)
        },
      ),
    )
  })

  it('404 for an unknown worker and for a profile whose account is not a WORKER', async () => {
    await expect(setWorkerSuspension({ db: fakeDb({}).db, clock }, 'p1', true)).rejects.toSatisfy(is404)
    const admin = fakeDb({ profile: { id: 'p1', userId: 'u1', isActivated: false }, user: { role: 'ADMIN', status: 'ACTIVE' } })
    await expect(setWorkerSuspension({ db: admin.db, clock }, 'p1', true)).rejects.toSatisfy(is404)
    expect(admin.writes).toEqual([])
  })
})
