// Every row of a paginated apps/api list, page by page (the admin CSV downloads). The first failure is returned as it came.
import type { ApiOutcome } from './outcome'

interface Page<R> {
  data: R[]
  pagination: { hasNext: boolean }
}

export async function allPages<R>(fetchPage: (page: number) => Promise<ApiOutcome<Page<R>>>): Promise<ApiOutcome<R[]>> {
  const rows: R[] = []
  for (let page = 1; ; page++) {
    const result = await fetchPage(page)
    if (result.kind !== 'ok') return result
    rows.push(...result.body.data)
    if (!result.body.pagination.hasNext) return { kind: 'ok', body: rows }
  }
}
