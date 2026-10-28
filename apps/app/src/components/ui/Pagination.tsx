// The admin lists' page control (moved out of the worker search, admin-clients U2 A6): the contract's page block in,
// the chosen page out. Up to five page numbers around the current one; Previous/Next only on small screens.
interface PaginationProps {
  pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
  onPage: (page: number) => void
}

const MAX_PAGES_SHOWN = 5

export default function Pagination({ pagination, onPage }: PaginationProps) {
  const { page, totalPages, hasNext, hasPrev } = pagination

  let startPage = Math.max(1, page - Math.floor(MAX_PAGES_SHOWN / 2))
  const endPage = Math.min(totalPages, startPage + MAX_PAGES_SHOWN - 1)
  if (endPage - startPage + 1 < MAX_PAGES_SHOWN) startPage = Math.max(1, endPage - MAX_PAGES_SHOWN + 1)
  const pageNumbers: number[] = []
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPage(page - 1)}
          disabled={!hasPrev}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={!hasNext}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPage(page - 1)}
              disabled={!hasPrev}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              ←
            </button>
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPage(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  pageNum === page
                    ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => onPage(page + 1)}
              disabled={!hasNext}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              →
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
