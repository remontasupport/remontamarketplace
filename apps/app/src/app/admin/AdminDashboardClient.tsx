'use client'

// The admin worker search (U2 admin-search, PR 3): the dashboard reads through
// apps/api (`adminApi`, a bearer token minted by this app) instead of the old
// Next.js route. The suburb is one of ours (an au_localities id from the
// autocomplete), "Within" is a radius from its centre computed by PostGIS, every
// other filter combines with it, and workers with no mapped suburb are counted
// and listable. Repeats within a minute come from the browser's private cache and
// the api's memo; the refresh button and every admin action reload past both.
// Rules: construction/admin-search/functional-design/business-rules.md R11.

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import type { WorkerRow, WorkerSearchResponse } from '@remonta/api-contract'
import { useCategories } from '@/hooks/queries/useCategories'
import WorkerAvatar from '@/components/ui/WorkerAvatar'
import { adminApi, type ApiOutcome } from '@/lib/api/admin'
import {
  DEFAULT_FILTERS,
  EXPERIENCE_OPTIONS,
  THERAPEUTIC_CATEGORY_ID,
  WITHIN_OPTIONS_KM,
  canonicalOf,
  filtersFromURL,
  toQuery,
  urlFromFilters,
  type AdminFilters,
} from '@/features/admin-search/query'

// ============================================================================
// TYPES
// ============================================================================

type Contractor = WorkerRow

/** What /api/suburbs answers (lib/suburbs): the id is an au_localities id, null for a Google fallback. */
interface SuburbMatch {
  id: number | null
  name: string
  postcode: string
  state: { abbreviation: string }
}

/** The panel's draft until "Apply Filters" (E7 pendingFilters). */
type PendingFilters = Pick<
  AdminFilters,
  'locality' | 'withinKm' | 'typeOfSupport' | 'gender' | 'hasVehicle' | 'workerType' | 'languages' | 'age' | 'therapeuticSubcategories' | 'experienceWith'
>

const pendingOf = (f: AdminFilters): PendingFilters => ({
  locality: f.locality,
  withinKm: f.withinKm,
  typeOfSupport: f.typeOfSupport,
  gender: f.gender,
  hasVehicle: f.hasVehicle,
  workerType: f.workerType,
  languages: f.languages,
  age: f.age,
  therapeuticSubcategories: f.therapeuticSubcategories,
  experienceWith: f.experienceWith,
})

const suburbLabel = (s: SuburbMatch) => `${s.name} ${s.state.abbreviation} ${s.postcode}`

const QUERY_KEY = 'admin-workers'

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Fetch categories from database
  const { data: categories, isLoading: isCategoriesLoading } = useCategories()

  // State for filters (unified state) - Initialize from URL params (R11.2)
  const [filters, setFilters] = useState<AdminFilters>(() => filtersFromURL(new URLSearchParams(searchParams.toString())))

  // Initialize search input from URL as well
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '')

  // Pending advanced filters (not applied until "Apply Filters" is clicked)
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(() => pendingOf(filters))

  // Contractor modal state (isModalOpen derived from selectedContractor !== null)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [showToggleForContractor, setShowToggleForContractor] = useState<string | null>(null)

  // Inactive (suspended) workers modal state (grouped)
  const [inactiveWorkersState, setInactiveWorkersState] = useState({
    isOpen: false,
    workers: [] as Contractor[],
    total: 0,
    isLoading: false,
  })

  // Suburb autocomplete states; the picked suburb lives in pendingFilters.locality (R11.3)
  const [suburbSearch, setSuburbSearch] = useState(() => filters.locality?.label ?? '')
  const [suburbs, setSuburbs] = useState<SuburbMatch[]>([])
  const [isLoadingSuburbs, setIsLoadingSuburbs] = useState(false)
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false)
  const suburbDropdownRef = useRef<HTMLDivElement>(null)
  const isSuburbSelectedRef = useRef(false)

  // Language filter states
  const [languageSearch, setLanguageSearch] = useState('')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const languageDropdownRef = useRef<HTMLDivElement>(null)

  // Available languages (from registration)
  const AVAILABLE_LANGUAGES = [
    "English", "Mandarin", "Cantonese", "Spanish", "Arabic", "Hindi", "Vietnamese",
    "Italian", "Greek", "Korean", "Japanese", "French", "German", "Portuguese",
    "Polish", "Turkish", "Tagalog", "Thai", "Persian", "Urdu", "Indonesian",
    "Malay", "Russian", "Croatian", "Serbian", "Macedonian", "Punjabi", "Tamil",
    "Telugu", "Bengali", "Sinhala", "Nepali", "Somali", "Swahili", "Amharic",
    "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Czech", "Hungarian",
    "Romanian", "Ukrainian", "Hebrew", "Khmer", "Burmese", "Lao"
  ]

  // Filter languages based on search
  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(languageSearch.toLowerCase())
  )

  // Therapeutic subcategories filter states
  const [therapeuticSubcategories, setTherapeuticSubcategories] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingTherapeuticSubcategories, setIsLoadingTherapeuticSubcategories] = useState(false)
  const [therapeuticSubcategorySearch, setTherapeuticSubcategorySearch] = useState('')
  const [showTherapeuticSubcategoryDropdown, setShowTherapeuticSubcategoryDropdown] = useState(false)
  const therapeuticSubcategoryDropdownRef = useRef<HTMLDivElement>(null)

  // Filter therapeutic subcategories based on search
  const filteredTherapeuticSubcategories = therapeuticSubcategories.filter(sub =>
    sub.name.toLowerCase().includes(therapeuticSubcategorySearch.toLowerCase())
  )

  // Close all dropdowns when clicking outside (combined handler)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (suburbDropdownRef.current && !suburbDropdownRef.current.contains(target)) {
        setShowSuburbDropdown(false)
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
        setShowLanguageDropdown(false)
      }
      if (therapeuticSubcategoryDropdownRef.current && !therapeuticSubcategoryDropdownRef.current.contains(target)) {
        setShowTherapeuticSubcategoryDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch therapeutic subcategories when Therapeutic Supports is selected
  useEffect(() => {
    const fetchTherapeuticSubcategories = async () => {
      if (pendingFilters.typeOfSupport !== THERAPEUTIC_CATEGORY_ID) {
        setTherapeuticSubcategories([])
        return
      }

      setIsLoadingTherapeuticSubcategories(true)
      try {
        const response = await fetch('/api/categories/therapeutic-supports/subcategories')
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          setTherapeuticSubcategories(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch therapeutic subcategories:', error)
        setTherapeuticSubcategories([])
      } finally {
        setIsLoadingTherapeuticSubcategories(false)
      }
    }

    fetchTherapeuticSubcategories()
  }, [pendingFilters.typeOfSupport])

  // Fetch suburbs from API (our own list; a row without an id is a Google fallback and cannot be searched from)
  useEffect(() => {
    const fetchSuburbs = async () => {
      // Don't fetch if user just selected an item
      if (isSuburbSelectedRef.current) {
        isSuburbSelectedRef.current = false
        return
      }

      if (suburbSearch.length < 2) {
        setSuburbs([])
        setShowSuburbDropdown(false)
        return
      }

      setIsLoadingSuburbs(true)
      try {
        const response = await fetch(`/api/suburbs?q=${encodeURIComponent(suburbSearch)}`)
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          setSuburbs(data as SuburbMatch[])
          setShowSuburbDropdown(true)
        } else {
          setSuburbs([])
          setShowSuburbDropdown(false)
        }
      } catch {
        setSuburbs([])
        setShowSuburbDropdown(false)
      } finally {
        setIsLoadingSuburbs(false)
      }
    }

    const timeoutId = setTimeout(fetchSuburbs, 300) // Debounce for 300ms
    return () => clearTimeout(timeoutId)
  }, [suburbSearch])

  // Sync filters to the URL whenever they change: the canonical query plus the suburb label (R11.2)
  useEffect(() => {
    const newURL = urlFromFilters(filters)
    const currentPath = window.location.pathname
    const newFullURL = currentPath + newURL

    // Only update URL if it's different from current URL
    if (newFullURL !== window.location.pathname + window.location.search) {
      router.replace(newFullURL, { scroll: false })
    }
  }, [filters, router])

  // The search itself: one canonical key per set of filters; `reload` after a refresh or an admin action (R11.5, R11.7)
  const reloadRef = useRef(false)
  const canonical = canonicalOf(filters)
  const { data: outcome, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery<ApiOutcome<WorkerSearchResponse>>({
    queryKey: [QUERY_KEY, canonical],
    queryFn: async () => {
      const reload = reloadRef.current
      reloadRef.current = false
      return adminApi.searchWorkers(toQuery(filters), { cache: reload ? 'reload' : 'default' })
    },
    placeholderData: keepPreviousData,
    staleTime: 60000, // the api's private cache and memo horizon (60 s)
  })

  // The last successful response stays on screen through any other outcome (R11.6)
  const [results, setResults] = useState<WorkerSearchResponse | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  useEffect(() => {
    if (outcome?.kind === 'ok') {
      setResults(outcome.body)
      setFetchedAt(dataUpdatedAt)
    }
  }, [outcome, dataUpdatedAt])

  const reload = useCallback(() => {
    reloadRef.current = true
    void refetch()
  }, [refetch])

  // U1's outcome contract: sign in again, wait out a limit automatically, or keep the last results with a notice
  useEffect(() => {
    if (outcome?.kind === 'unauthenticated') {
      const here = window.location.pathname + window.location.search
      router.push(`/login?callbackUrl=${encodeURIComponent(here)}`)
    }
    if (outcome?.kind === 'rateLimited') {
      const t = setTimeout(() => void refetch(), Math.min(outcome.retryAfterSeconds, 60) * 1000)
      return () => clearTimeout(t)
    }
  }, [outcome, router, refetch])

  // Mutation for toggling worker status; the list is reloaded past both caches afterwards (R11.7)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ contractorId, isActive }: { contractorId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/contractors/${contractorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }
      return data
    },
    onSuccess: () => {
      reloadRef.current = true
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (error) => {
      console.error('[Toggle Status] Error:', error)
      alert('Failed to update worker status: ' + error.message)
    }
  })

  // ========================================
  // HANDLERS
  // ========================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      ...pendingFilters,
      // a distance sort only makes sense with a suburb (R11.3)
      sortBy: prev.sortBy === 'distance' && !pendingFilters.locality ? undefined : prev.sortBy,
      page: 1,
    }))
  }

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS })
    setPendingFilters(pendingOf(DEFAULT_FILTERS))
    setSearchInput('')
    setSuburbSearch('')
    setLanguageSearch('')
    setTherapeuticSubcategorySearch('')
  }

  const pickSuburb = (suburb: SuburbMatch) => {
    if (suburb.id === null) return
    const label = suburbLabel(suburb)
    isSuburbSelectedRef.current = true
    setShowSuburbDropdown(false)
    setSuburbs([])
    setPendingFilters(prev => ({ ...prev, locality: { id: suburb.id as number, label } }))
    setSuburbSearch(label)
  }

  const changeSuburbText = (value: string) => {
    setSuburbSearch(value)
    // A cleared or edited box means no suburb until one is picked again; "Within" resets with it (R11.3)
    setPendingFilters(prev => (prev.locality ? { ...prev, locality: undefined, withinKm: undefined } : prev))
  }

  const showUnmapped = () => {
    setFilters(prev => ({ ...prev, unplaced: true, page: 1, sortBy: prev.sortBy === 'distance' ? undefined : prev.sortBy }))
  }

  const backToSearch = () => {
    setFilters(prev => ({ ...prev, unplaced: false, page: 1 }))
  }

  const fetchInactiveWorkers = async () => {
    setInactiveWorkersState(prev => ({ ...prev, isLoading: true }))
    const result = await adminApi.listSuspendedWorkers({ page: 1, pageSize: 100 }, { cache: 'reload' })
    if (result.kind === 'ok') {
      setInactiveWorkersState({ isOpen: true, workers: result.body.data, total: result.body.pagination.total, isLoading: false })
    } else {
      setInactiveWorkersState(prev => ({ ...prev, isLoading: false }))
      if (result.kind === 'unauthenticated') {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      } else {
        alert('Failed to fetch inactive workers: ' + noticeText(result))
      }
    }
  }

  const reactivateWorker = async (contractorId: string) => {
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })
      const result = await response.json()
      if (result.success) {
        // Remove from inactive list
        setInactiveWorkersState(prev => ({
          ...prev,
          workers: prev.workers.filter(w => w.id !== contractorId),
          total: Math.max(0, prev.total - 1),
        }))
        // Refresh main list past the caches (R11.7)
        reloadRef.current = true
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      } else {
        alert('Failed to reactivate worker: ' + result.error)
      }
    } catch (error) {
      console.error('Error reactivating worker:', error)
      alert('Failed to reactivate worker')
    }
  }

  // ========================================
  // RENDER HELPERS
  // ========================================

  const renderPagination = () => {
    if (!results?.pagination) return null

    const { page, totalPages, hasNext, hasPrev } = results.pagination

    // Generate page numbers to display (max 5)
    const pageNumbers: number[] = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!hasPrev}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
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
                onClick={() => handlePageChange(page - 1)}
                disabled={!hasPrev}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                ←
              </button>
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(page + 1)}
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

  const notice = outcome && outcome.kind !== 'ok' && outcome.kind !== 'unauthenticated' ? outcome : null
  const localityInUse = results?.appliedFilters.locality
  const withinDisabled = !pendingFilters.locality || filters.unplaced

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Filters Sidebar */}
        <aside className="w-[480px] bg-white border-r border-gray-200 min-h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-end gap-2 mb-4">
              <button
                onClick={clearFilters}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={applyFilters}
                data-testid="admin-search-apply-button"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Apply Filters
              </button>
            </div>

            {filters.unplaced && (
              <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Showing workers with no mapped suburb. The suburb and distance filters are off in this list.{' '}
                <button type="button" onClick={backToSearch} className="font-medium underline hover:text-amber-900">
                  Back to search
                </button>
              </div>
            )}

            {/* Suburb (one of ours: the autocomplete's id is what the api measures from) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Suburb
              </label>
              <div className="relative" ref={suburbDropdownRef}>
                <input
                  type="text"
                  value={suburbSearch}
                  onChange={(e) => changeSuburbText(e.target.value)}
                  onFocus={() => {
                    if (suburbs.length > 0) setShowSuburbDropdown(true)
                  }}
                  disabled={filters.unplaced}
                  data-testid="admin-search-suburb-input"
                  placeholder="e.g. Parramatta, 2150"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
                {isLoadingSuburbs && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                  </div>
                )}

                {/* Suburb Dropdown */}
                {showSuburbDropdown && suburbs.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suburbs.map((suburb, index) => (
                      <button
                        key={`${suburb.name}-${suburb.postcode}-${index}`}
                        type="button"
                        disabled={suburb.id === null}
                        title={suburb.id === null ? 'Not in our suburb list: it cannot be searched from' : undefined}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 text-sm disabled:text-gray-400 disabled:hover:bg-white"
                        onClick={() => pickSuburb(suburb)}
                      >
                        <span className={suburb.id === null ? 'text-gray-400' : 'text-gray-900 font-medium'}>
                          {suburbLabel(suburb)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {pendingFilters.locality && (
                <p className="mt-1 text-xs text-gray-500">Measuring from the centre of {pendingFilters.locality.label}.</p>
              )}
            </div>

            {/* Within (Distance): only with a suburb (R11.3) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Within
              </label>
              <select
                value={pendingFilters.withinKm ?? 'none'}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, withinKm: e.target.value === 'none' ? undefined : Number(e.target.value) }))}
                disabled={withinDisabled}
                data-testid="admin-search-within-select"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="none">Any distance</option>
                {WITHIN_OPTIONS_KM.map((km) => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
              {withinDisabled && !filters.unplaced && (
                <p className="mt-1 text-xs text-gray-500">Pick a suburb to filter by distance.</p>
              )}
            </div>

            {/* Type of Support (sends the category id) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type of support
              </label>
              <div className="space-y-2">
                {isCategoriesLoading ? (
                  <div className="text-sm text-gray-500">Loading services...</div>
                ) : (
                  categories?.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          pendingFilters.typeOfSupport === category.id
                            ? 'bg-gray-900 border-gray-900'
                            : 'border-gray-300 group-hover:border-gray-400'
                        }`}
                        onClick={() => {
                          setPendingFilters(prev => ({
                            ...prev,
                            typeOfSupport: prev.typeOfSupport === category.id ? undefined : category.id,
                            therapeuticSubcategories: prev.typeOfSupport === category.id || category.id !== THERAPEUTIC_CATEGORY_ID ? [] : prev.therapeuticSubcategories,
                          }))
                        }}
                      >
                        {pendingFilters.typeOfSupport === category.id && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Experience With (display names; the query carries CareDomain values) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Experience with
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_OPTIONS.map(({ label: item }) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setPendingFilters(prev => {
                        const current = prev.experienceWith || []
                        const isSelected = current.includes(item)
                        return {
                          ...prev,
                          experienceWith: isSelected
                            ? current.filter(i => i !== item)
                            : [...current, item]
                        }
                      })
                    }}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-colors ${
                      (pendingFilters.experienceWith || []).includes(item)
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Therapeutic Subcategories (conditional) */}
            {pendingFilters.typeOfSupport === THERAPEUTIC_CATEGORY_ID && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Therapeutic Subcategories
                </label>
                <div className="relative" ref={therapeuticSubcategoryDropdownRef}>
                  <div
                    onClick={() => setShowTherapeuticSubcategoryDropdown(!showTherapeuticSubcategoryDropdown)}
                    className="min-h-[42px] rounded-md border border-gray-300 px-4 py-2 text-sm bg-white cursor-pointer"
                  >
                    {pendingFilters.therapeuticSubcategories.length === 0 ? (
                      <span className="text-gray-400">All subcategories</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {pendingFilters.therapeuticSubcategories.map((subId) => {
                          const sub = therapeuticSubcategories.find(s => s.id === subId)
                          return (
                            <span
                              key={subId}
                              className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-medium"
                            >
                              {sub?.name || subId}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPendingFilters(prev => ({
                                    ...prev,
                                    therapeuticSubcategories: prev.therapeuticSubcategories.filter(id => id !== subId)
                                  }))
                                }}
                                className="hover:text-indigo-600"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {showTherapeuticSubcategoryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-200">
                        <input
                          type="text"
                          placeholder="Search subcategories..."
                          value={therapeuticSubcategorySearch}
                          onChange={(e) => setTherapeuticSubcategorySearch(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {isLoadingTherapeuticSubcategories ? (
                          <div className="px-4 py-3 text-gray-500 text-center text-sm">Loading...</div>
                        ) : filteredTherapeuticSubcategories.length === 0 ? (
                          <div className="px-4 py-3 text-gray-500 text-center text-sm">No subcategories found</div>
                        ) : (
                          filteredTherapeuticSubcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              onClick={() => {
                                const isSelected = pendingFilters.therapeuticSubcategories.includes(subcategory.id)
                                setPendingFilters(prev => ({
                                  ...prev,
                                  therapeuticSubcategories: isSelected
                                    ? prev.therapeuticSubcategories.filter(id => id !== subcategory.id)
                                    : [...prev.therapeuticSubcategories, subcategory.id]
                                }))
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                pendingFilters.therapeuticSubcategories.includes(subcategory.id)
                                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{subcategory.name}</span>
                                {pendingFilters.therapeuticSubcategories.includes(subcategory.id) && (
                                  <span className="text-indigo-600">✓</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Gender */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Gender
              </label>
              <select
                value={pendingFilters.gender}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, gender: e.target.value as AdminFilters['gender'] }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Age */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Age
              </label>
              <select
                value={pendingFilters.age}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, age: e.target.value as AdminFilters['age'] }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All</option>
                <option value="20-30">20-30</option>
                <option value="31-45">31-45</option>
                <option value="46-60">46-60</option>
                <option value="60+">60 above</option>
              </select>
            </div>

            {/* Languages */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Languages
              </label>
              <div className="relative" ref={languageDropdownRef}>
                <div
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="min-h-[42px] rounded-md border border-gray-300 px-4 py-2 text-sm bg-white cursor-pointer"
                >
                  {pendingFilters.languages.length === 0 ? (
                    <span className="text-gray-400">All languages</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {pendingFilters.languages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-medium"
                        >
                          {lang}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPendingFilters(prev => ({
                                ...prev,
                                languages: prev.languages.filter(l => l !== lang)
                              }))
                            }}
                            className="hover:text-indigo-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {showLanguageDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Search languages..."
                        value={languageSearch}
                        onChange={(e) => setLanguageSearch(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredLanguages.map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => {
                            const isSelected = pendingFilters.languages.includes(language)
                            setPendingFilters(prev => ({
                              ...prev,
                              languages: isSelected
                                ? prev.languages.filter(l => l !== language)
                                : [...prev.languages, language]
                            }))
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            pendingFilters.languages.includes(language)
                              ? 'bg-indigo-50 text-indigo-700 font-medium'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{language}</span>
                            {pendingFilters.languages.includes(language) && (
                              <span className="text-indigo-600">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {filteredLanguages.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-center text-sm">No languages found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Driver Access */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Driver Access
              </label>
              <select
                value={pendingFilters.hasVehicle}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, hasVehicle: e.target.value as AdminFilters['hasVehicle'] }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Worker Type */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Worker Type
              </label>
              <select
                value={pendingFilters.workerType}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, workerType: e.target.value as AdminFilters['workerType'] }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All</option>
                <option value="Employee">Employee</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>

            {/* Show Inactive Workers */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={fetchInactiveWorkers}
                disabled={inactiveWorkersState.isLoading}
                className="w-full text-sm text-gray-500 hover:text-indigo-600 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-wait py-2"
              >
                {inactiveWorkersState.isLoading ? 'Loading...' : 'Show Inactive Workers'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Results Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Results</h1>

            {/* Name Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                maxLength={100}
                placeholder="Search by name or mobile..."
                className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Search
              </button>
            </form>
          </div>

          {/* Loading State (first load only; later fetches keep the last results on screen) */}
          {isLoading && !results && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Loading contractors...</p>
              </div>
            </div>
          )}

          {/* Notice (U1's outcome contract): the last results stay below it */}
          {notice && (
            <div
              data-testid="admin-search-notice"
              className={`rounded-md p-4 mb-4 ${notice.kind === 'rateLimited' ? 'bg-amber-50' : 'bg-red-50'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-medium ${notice.kind === 'rateLimited' ? 'text-amber-800' : 'text-red-800'}`}>
                    {noticeTitle(notice)}
                  </h3>
                  <p className={`mt-1 text-sm ${notice.kind === 'rateLimited' ? 'text-amber-700' : 'text-red-700'}`}>{noticeText(notice)}</p>
                </div>
                {(notice.kind === 'unavailable' || notice.kind === 'failed') && (
                  <button
                    type="button"
                    onClick={reload}
                    className="shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Contractor Cards */}
          {results && (
            <div>
              {/* Loading overlay while fetching */}
              {isFetching && (
                <div className="h-1 bg-indigo-600 animate-pulse rounded mb-4"></div>
              )}

              {/* Results Count, freshness, the unmapped line (R11.4, R11.5) */}
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-semibold text-gray-900">
                  {results.pagination.total} contractors found
                  {localityInUse && !filters.unplaced && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {results.appliedFilters.withinKm ? `within ${results.appliedFilters.withinKm} km of` : 'nearest first from'} {localityInUse.label}
                    </span>
                  )}
                  {filters.unplaced && <span className="ml-2 text-sm font-normal text-gray-500">with no mapped suburb</span>}
                </p>
                <p className="text-xs text-gray-500">
                  Results may be up to a minute old
                  {fetchedAt ? ` · fetched ${new Date(fetchedAt).toLocaleTimeString()}` : ''}
                  <button
                    type="button"
                    onClick={reload}
                    disabled={isFetching}
                    data-testid="admin-search-refresh-button"
                    className="ml-2 font-medium text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </p>
              </div>
              {!filters.unplaced && results.unplacedCount > 0 && (
                <p className="mb-4 text-sm text-gray-600">
                  {results.unplacedCount} active {results.unplacedCount === 1 ? 'worker has' : 'workers have'} no mapped suburb and cannot appear in a distance search.{' '}
                  <button type="button" onClick={showUnmapped} data-testid="admin-search-unmapped-link" className="font-medium text-indigo-600 hover:underline">
                    Show them
                  </button>
                </p>
              )}

              {/* Cards List */}
              {results.data.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">No contractors found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.data.map((contractor) => (
                    <div
                      key={contractor.id}
                      className={`bg-white rounded-lg border-2 border-amber-400 p-4 hover:shadow-md transition-shadow ${!contractor.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex gap-4">
                        {/* Profile Photo */}
                        <WorkerAvatar
                          photo={contractor.photos}
                          firstName={contractor.firstName}
                          lastName={contractor.lastName}
                          size={80}
                          className="border-2 border-white shadow"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name and Status */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {contractor.firstName} {contractor.lastName?.[0]}.
                            </h3>
                            <div className="flex items-center gap-2">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowToggleForContractor(
                                    showToggleForContractor === contractor.id ? null : contractor.id
                                  );
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full cursor-pointer hover:bg-green-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Active
                              </span>
                              {showToggleForContractor === contractor.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatusMutation.mutate({
                                      contractorId: contractor.id,
                                      isActive: !contractor.isActive
                                    })
                                  }}
                                  disabled={toggleStatusMutation.isPending}
                                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    contractor.isActive ? 'bg-green-500' : 'bg-gray-300'
                                  } ${toggleStatusMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                                  role="switch"
                                  aria-checked={contractor.isActive}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      contractor.isActive ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Services */}
                          {contractor.services && contractor.services.length > 0 && (
                            <p className="text-xs text-gray-600 mb-2">
                              {contractor.services.join(' / ')}
                            </p>
                          )}

                          {/* Details Row */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            {/* Distance from the suburb centre (R6.4) */}
                            {contractor.distanceKm !== undefined && (
                              <span className="inline-flex items-center gap-1" title="Distance between the two suburb centres">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {contractor.distanceKm} km from the suburb centre
                              </span>
                            )}

                            {/* Location: the mapped home suburb, else the legacy text */}
                            {(contractor.location || contractor.city || contractor.state) && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {contractor.location
                                  ? contractor.location.localityLabel
                                  : contractor.city && contractor.state
                                    ? `${contractor.city}, ${contractor.state}`
                                    : contractor.city || contractor.state}
                                {!contractor.location && <span className="text-gray-400">(no mapped suburb)</span>}
                              </span>
                            )}

                            {/* Gender */}
                            {contractor.gender && (
                              <span className="inline-flex items-center gap-1 capitalize">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {contractor.gender}
                              </span>
                            )}

                            {/* Age */}
                            {contractor.age && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {contractor.age} years old
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <a
                              href={`/admin/contractors/${contractor.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Profile
                            </a>

                            <a
                              href={`/admin/contractors/${contractor.userId}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Show Profile
                            </a>

                            <a
                              href={`/admin/compliance/${contractor.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Show Compliance
                            </a>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContractor(selectedContractor?.id === contractor.id ? null : contractor);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Contact Info
                            </button>
                          </div>

                          {/* Contact Information Expandable */}
                          {selectedContractor?.id === contractor.id && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <h4 className="font-medium text-gray-900 text-xs mb-2">Contact Details</h4>
                              <div className="space-y-2">
                                {contractor.email && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <a href={`mailto:${contractor.email}`} className="text-indigo-600 hover:underline">
                                      {contractor.email}
                                    </a>
                                  </div>
                                )}
                                {contractor.mobile && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <a href={`tel:${contractor.mobile}`} className="text-indigo-600 hover:underline">
                                      {contractor.mobile}
                                    </a>
                                  </div>
                                )}
                                {!contractor.email && !contractor.mobile && (
                                  <p className="text-xs text-gray-500 italic">No contact information available</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {renderPagination()}
            </div>
          )}
        </main>
      </div>

      {/* Inactive Workers Modal */}
      {inactiveWorkersState.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setInactiveWorkersState(prev => ({ ...prev, isOpen: false }))}
          ></div>

          {/* Modal */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Inactive Workers ({inactiveWorkersState.total})
                </h3>
                <button
                  onClick={() => setInactiveWorkersState(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[60vh] p-6">
                {inactiveWorkersState.workers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No inactive workers found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inactiveWorkersState.workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <WorkerAvatar
                            photo={worker.photos}
                            firstName={worker.firstName}
                            lastName={worker.lastName}
                            size={40}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {worker.firstName} {worker.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {worker.email || worker.mobile || 'No contact info'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => reactivateWorker(worker.id)}
                          className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full hover:bg-green-100 hover:border-green-300 transition-colors"
                        >
                          Reactivate
                        </button>
                      </div>
                    ))}
                    {inactiveWorkersState.total > inactiveWorkersState.workers.length && (
                      <p className="text-center text-xs text-gray-500">Showing the first {inactiveWorkersState.workers.length} of {inactiveWorkersState.total}.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// NOTICES (U1's outcome contract, frontend-components.md)
// ============================================================================

function noticeTitle(o: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): string {
  switch (o.kind) {
    case 'forbidden':
      return 'Your account cannot use the admin search'
    case 'rateLimited':
      return 'Too many searches'
    case 'unavailable':
      return 'The search is temporarily unavailable'
    case 'unauthenticated':
      return 'Please sign in again'
    default:
      return 'The search could not be completed'
  }
}

function noticeText(o: Exclude<ApiOutcome<unknown>, { kind: 'ok' }>): string {
  switch (o.kind) {
    case 'forbidden':
      return 'This happens while impersonating a user or after a role change. The last results are kept.'
    case 'rateLimited':
      return `Retrying automatically in ${o.retryAfterSeconds} seconds. The last results are kept.`
    case 'unavailable':
      return 'Please try again in a moment. The last results are kept.'
    case 'unauthenticated':
      return 'Your session has ended.'
    default: {
      const fields = o.fields ? Object.entries(o.fields).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ') : ''
      return `${fields || 'Something went wrong'}${o.requestId ? ` (request ${o.requestId})` : ''}.`
    }
  }
}
