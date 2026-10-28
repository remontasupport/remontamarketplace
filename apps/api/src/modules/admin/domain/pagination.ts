// The admin lists' page block (the contract's paginationSchema), computed once for every paged list.
export function paginationOf(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize)
  return { total, page, pageSize, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
}
