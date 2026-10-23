// worker-activation U2 (P6): a worker is in the public list iff activated and not suspended; the signed-in client
// search shows every unsuspended worker (user, 2026-10-23).
import fc from 'fast-check'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isListable, LISTABLE_WORKER } from './listable'

/** Reads a Prisma where of the shape LISTABLE_WORKER uses against one worker, as the database would. */
function matches(where: { isActivated: boolean; user: { status: string } }, w: { isActivated: boolean; status: string }): boolean {
  return w.isActivated === where.isActivated && w.status === where.user.status
}

describe('LISTABLE_WORKER', () => {
  it('P6: listed iff activated and ACTIVE, for any flag and any account status', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.constantFrom('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION'), (isActivated, status) => {
        const w = { isActivated, status }
        expect(matches(LISTABLE_WORKER, w)).toBe(isActivated && status === 'ACTIVE')
        expect(isListable(w)).toBe(matches(LISTABLE_WORKER, w))
      }),
    )
  })

  it('the public list uses it; the client search and the assigned workers do not', () => {
    const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
    const pub = src('../../app/api/public/workers/route.ts')
    expect(pub).toContain("from '@/lib/workers/listable'")
    expect(pub).toContain('...LISTABLE_WORKER')
    const client = src('../../app/api/client/workers/route.ts')
    expect(client).not.toContain('LISTABLE_WORKER')
    expect(client).not.toContain('isActivated')
    expect(client).toMatch(/user:\s*\{\s*status:\s*'ACTIVE'\s*\}/)
    expect(src('../../app/api/client/workers/by-ids/route.ts')).not.toContain('LISTABLE_WORKER')
  })
})
