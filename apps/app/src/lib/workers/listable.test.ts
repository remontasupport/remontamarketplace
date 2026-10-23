// worker-activation U2 (P6): a worker is listed to clients and the public iff activated and not suspended, and both
// list routes build their base condition from that one declaration.
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

  it('both list routes use it; the assigned-workers route does not (BR-U4)', () => {
    const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
    for (const route of ['../../app/api/client/workers/route.ts', '../../app/api/public/workers/route.ts']) {
      const s = src(route)
      expect(s, route).toContain("from '@/lib/workers/listable'")
      expect(s, route).toContain('...LISTABLE_WORKER')
      expect(s, route).not.toMatch(/user:\s*\{\s*status:\s*'ACTIVE'\s*\}/)
    }
    expect(src('../../app/api/client/workers/by-ids/route.ts')).not.toContain('LISTABLE_WORKER')
  })
})
