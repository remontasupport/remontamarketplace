// admin-clients U2 follow-up: the records before and after this one in the list it was opened from (same filters,
// same order). Within a page the neighbours are on it; at an edge they are the last / first of the adjacent page,
// which the caller reads only when `wantBefore` / `wantAfter` asks for it.

export interface ListPage {
  page: number
  pageSize: number
  total: number
  ids: string[]
  hasPrev: boolean
  hasNext: boolean
}

export interface Neighbour {
  userId: string
  page: number
}

export interface Neighbours {
  prev?: Neighbour
  next?: Neighbour
  /** The adjacent page is needed for a neighbour. */
  wantBefore: boolean
  wantAfter: boolean
  /** "3 of 36", when the record is on the page. */
  position?: { index: number; total: number }
}

export function neighboursOf(userId: string, current: ListPage | undefined, before?: ListPage, after?: ListPage): Neighbours {
  const i = current ? current.ids.indexOf(userId) : -1
  if (!current || i < 0) return { wantBefore: false, wantAfter: false }
  const last = current.ids.length - 1
  const wantBefore = i === 0 && current.hasPrev
  const wantAfter = i === last && current.hasNext
  const prevId = i > 0 ? current.ids[i - 1] : before?.ids[before.ids.length - 1]
  const nextId = i < last ? current.ids[i + 1] : after?.ids[0]
  return {
    ...(prevId ? { prev: { userId: prevId, page: i > 0 ? current.page : current.page - 1 } } : {}),
    ...(nextId ? { next: { userId: nextId, page: i < last ? current.page : current.page + 1 } } : {}),
    wantBefore,
    wantAfter,
    position: { index: (current.page - 1) * current.pageSize + i + 1, total: current.total },
  }
}
