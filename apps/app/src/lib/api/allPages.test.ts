import { describe, expect, it, vi } from 'vitest'
import { allPages } from './allPages'

const page = (data: number[], hasNext: boolean) => ({ kind: 'ok' as const, body: { data, pagination: { hasNext } } })

describe('allPages', () => {
  it('reads until the last page, in order', async () => {
    const fetchPage = vi.fn(async (p: number) => (p === 1 ? page([1, 2], true) : page([3], false)))
    expect(await allPages(fetchPage)).toEqual({ kind: 'ok', body: [1, 2, 3] })
    expect(fetchPage.mock.calls.map((c) => c[0])).toEqual([1, 2])
  })

  it('stops at the first failure and returns it', async () => {
    const fetchPage = vi.fn(async (p: number) => (p === 1 ? page([1], true) : { kind: 'rateLimited' as const, retryAfterSeconds: 9 }))
    expect(await allPages(fetchPage)).toEqual({ kind: 'rateLimited', retryAfterSeconds: 9 })
  })
})
