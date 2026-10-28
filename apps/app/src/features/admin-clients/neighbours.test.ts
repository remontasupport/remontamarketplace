import { describe, expect, it } from 'vitest'
import { neighboursOf, type ListPage } from './neighbours'

const page = (n: number, ids: string[], o: Partial<ListPage> = {}): ListPage => ({ page: n, pageSize: 3, total: 7, ids, hasPrev: n > 1, hasNext: n < 3, ...o })

describe('previous / next record (admin-clients U2 follow-up)', () => {
  it('takes the neighbours on the same page, with the position in the whole list', () => {
    expect(neighboursOf('b', page(1, ['a', 'b', 'c']))).toEqual({ prev: { userId: 'a', page: 1 }, next: { userId: 'c', page: 1 }, wantBefore: false, wantAfter: false, position: { index: 2, total: 7 } })
  })

  it('asks for the adjacent page at an edge, then takes its last / first record', () => {
    const p2 = page(2, ['d', 'e', 'f'])
    expect(neighboursOf('d', p2)).toMatchObject({ next: { userId: 'e', page: 2 }, wantBefore: true, wantAfter: false })
    expect(neighboursOf('d', p2, page(1, ['a', 'b', 'c'])).prev).toEqual({ userId: 'c', page: 1 })
    expect(neighboursOf('f', p2, undefined, page(3, ['g'])).next).toEqual({ userId: 'g', page: 3 })
  })

  it('has no previous on the first record and no next on the last', () => {
    expect(neighboursOf('a', page(1, ['a', 'b', 'c']))).toMatchObject({ wantBefore: false })
    expect(neighboursOf('a', page(1, ['a', 'b', 'c'])).prev).toBeUndefined()
    expect(neighboursOf('g', page(3, ['g'])).next).toBeUndefined()
  })

  it('offers nothing for a record not on the list page (a changed filter, a direct link)', () => {
    expect(neighboursOf('z', page(1, ['a', 'b', 'c']))).toEqual({ wantBefore: false, wantAfter: false })
    expect(neighboursOf('a', undefined)).toEqual({ wantBefore: false, wantAfter: false })
  })
})
