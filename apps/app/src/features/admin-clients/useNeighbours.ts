'use client'

// The list page the detail was opened from, read with the list's own query key (usually already in the cache), and the
// adjacent page only when the record sits at an edge (neighbours.ts).
import { useQuery } from '@tanstack/react-query'
import type { RequesterListResponse } from '@remonta/api-contract'
import { adminApi } from '@/lib/api/admin'
import { filtersOf, roleOfTab, requestOf, type ListFilters } from './listQuery'
import { neighboursOf, type ListPage } from './neighbours'
import { requestersQueryKey } from './RequestersList'

function useListPage(tab: string | null, filters: ListFilters, enabled: boolean): ListPage | undefined {
  const role = roleOfTab(tab)
  const query = role ? requestOf(role, filters) : undefined
  const { data } = useQuery({
    queryKey: [...requestersQueryKey, query],
    queryFn: () => adminApi.listRequesters(query!),
    enabled: enabled && query !== undefined,
  })
  if (data?.kind !== 'ok') return undefined
  const b: RequesterListResponse = data.body
  return { ...b.pagination, ids: b.data.map((r) => r.userId) }
}

export function useNeighbours(userId: string, params: URLSearchParams) {
  const tab = params.get('tab')
  const filters = filtersOf(params)
  const current = useListPage(tab, filters, true)
  const edge = neighboursOf(userId, current)
  const before = useListPage(tab, { ...filters, page: filters.page - 1 }, edge.wantBefore)
  const after = useListPage(tab, { ...filters, page: filters.page + 1 }, edge.wantAfter)
  return { tab, filters, ...neighboursOf(userId, current, before, after) }
}
