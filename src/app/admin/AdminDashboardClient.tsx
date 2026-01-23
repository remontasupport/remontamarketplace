'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCategories } from '@/hooks/queries/useCategories'

// ============================================================================
// TYPES
// ============================================================================

interface Contractor {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string | null
  mobile: string | null
  gender: string | null
  age: number | null
  languages: string[]
  services: string[]
  city: string | null
  state: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  experience: string | null
  introduction: string | null
  photos: string[]
  createdAt: string
  updatedAt: string
  distance?: number // Only present when distance filtering is active
  isActive: boolean
}

interface PaginatedResponse {
  success: boolean
  data: Contractor[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface ContractorsFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Advanced filters
  location: string
  typeOfSupport: string
  gender: string
  hasVehicle: string
  workerType: string
  languages: string[]
  age: string
  within: string

  // Therapeutic subcategories filter (NEW)
  therapeuticSubcategories: string[]

  // Document filters (NEW)
  documentCategories: string[]
  documentStatuses: string[]
  requirementTypes: string[]
}

// ============================================================================
// API FUNCTION
// ============================================================================

async function fetchContractors(filters: ContractorsFilters): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  })

  // Filter groups by default value type
  const stringFilters = ['search', 'location'] as const
  const allDefaultFilters = ['typeOfSupport', 'gender', 'hasVehicle', 'workerType', 'age'] as const
  const noneDefaultFilters = ['within'] as const
  const arrayFilters = ['languages', 'therapeuticSubcategories', 'documentCategories', 'documentStatuses', 'requirementTypes'] as const

  // String filters (truthy check only)
  stringFilters.forEach(key => {
    const value = filters[key]
    if (value) params.append(key, value)
  })

  // String filters with 'all' as default
  allDefaultFilters.forEach(key => {
    const value = filters[key]
    if (value && value !== 'all') params.append(key, value)
  })

  // String filters with 'none' as default
  noneDefaultFilters.forEach(key => {
    const value = filters[key]
    if (value && value !== 'none') params.append(key, value)
  })

  // Array filters (join with comma)
  arrayFilters.forEach(key => {
    const value = filters[key]
    if (value && value.length > 0) params.append(key, value.join(','))
  })

  const response = await fetch(`/api/admin/contractors?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch contractors')
  }

  return response.json()
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse URL search params into filter state
 * Reads query parameters and converts them to the correct types
 */
function parseFiltersFromURL(searchParams: URLSearchParams): Partial<ContractorsFilters> {
  const filters: Partial<ContractorsFilters> = {}

  // Integer filters with default fallback
  const intFilters = [
    { key: 'page', fallback: 1 },
    { key: 'pageSize', fallback: 20 },
  ] as const

  intFilters.forEach(({ key, fallback }) => {
    const value = searchParams.get(key)
    if (value) (filters as Record<string, number>)[key] = parseInt(value, 10) || fallback
  })

  // Simple string filters (direct assignment)
  const stringFilters = [
    'search', 'sortBy', 'location', 'typeOfSupport',
    'gender', 'hasVehicle', 'workerType', 'age', 'within'
  ] as const

  stringFilters.forEach(key => {
    const value = searchParams.get(key)
    if (value) (filters as Record<string, string>)[key] = value
  })

  // Validated sortOrder (must be 'asc' or 'desc')
  const sortOrder = searchParams.get('sortOrder')
  if (sortOrder === 'asc' || sortOrder === 'desc') {
    filters.sortOrder = sortOrder
  }

  // Array filters (comma-separated)
  const arrayFilters = [
    'languages', 'therapeuticSubcategories',
    'documentCategories', 'documentStatuses', 'requirementTypes'
  ] as const

  arrayFilters.forEach(key => {
    const value = searchParams.get(key)
    if (value) (filters as Record<string, string[]>)[key] = value.split(',').filter(Boolean)
  })

  return filters
}

/**
 * Build URL query string from filter state
 * Only includes non-default values to keep URL clean
 */
function buildURLFromFilters(filters: ContractorsFilters): string {
  const params = new URLSearchParams()

  // Integer filters with default values to skip
  const intFilters = [
    { key: 'page', defaultValue: 1 },
    { key: 'pageSize', defaultValue: 20 },
  ] as const

  intFilters.forEach(({ key, defaultValue }) => {
    const value = filters[key]
    if (value && value !== defaultValue) {
      params.set(key, value.toString())
    }
  })

  // String filters with no default (truthy check only)
  const stringFilters = ['search', 'location'] as const

  stringFilters.forEach(key => {
    const value = filters[key]
    if (value) params.set(key, value)
  })

  // String filters with specific default values to skip
  const stringFiltersWithDefaults = [
    { key: 'sortBy', defaultValue: 'createdAt' },
    { key: 'sortOrder', defaultValue: 'desc' },
    { key: 'typeOfSupport', defaultValue: 'all' },
    { key: 'gender', defaultValue: 'all' },
    { key: 'hasVehicle', defaultValue: 'all' },
    { key: 'workerType', defaultValue: 'all' },
    { key: 'age', defaultValue: 'all' },
    { key: 'within', defaultValue: 'none' },
  ] as const

  stringFiltersWithDefaults.forEach(({ key, defaultValue }) => {
    const value = filters[key]
    if (value && value !== defaultValue) {
      params.set(key, value)
    }
  })

  // Array filters (join with comma)
  const arrayFilters = [
    'languages', 'therapeuticSubcategories',
    'documentCategories', 'documentStatuses', 'requirementTypes'
  ] as const

  arrayFilters.forEach(key => {
    const value = filters[key]
    if (value && value.length > 0) {
      params.set(key, value.join(','))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Convert distance in kilometers to travel time
 * Uses average driving speed in urban/suburban areas (40 km/h)
 * @param distanceKm - Distance in kilometers
 * @returns Formatted time string (e.g., "3 mins. away", "1 hr. 15 mins. away")
 */
function formatTravelTime(distanceKm: number): string {
  const AVERAGE_SPEED_KMH = 40; // Average urban driving speed
  const hours = distanceKm / AVERAGE_SPEED_KMH;
  const totalMinutes = Math.round(hours * 60);

  if (totalMinutes < 1) {
    return "< 1 min. away";
  } else if (totalMinutes < 60) {
    return `${totalMinutes} mins. away`;
  } else {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      return `${hrs} hr${hrs > 1 ? 's' : ''}. away`;
    }
    return `${hrs} hr${hrs > 1 ? 's' : ''}. ${mins} mins. away`;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Mutation for toggling worker status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ contractorId, isActive }: { contractorId: string; isActive: boolean }) => {
      console.log('[Toggle Status] Sending request:', { contractorId, isActive })
      const response = await fetch(`/api/admin/contractors/${contractorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      const data = await response.json()
      console.log('[Toggle Status] Response:', data)
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }
      return data
    },
    onSuccess: (data) => {
      console.log('[Toggle Status] Success:', data)
      // Invalidate and refetch contractors list
      queryClient.invalidateQueries({ queryKey: ['contractors'] })
    },
    onError: (error) => {
      console.error('[Toggle Status] Error:', error)
      alert('Failed to update worker status: ' + error.message)
    }
  })

  // Fetch categories from database
  const { data: categories, isLoading: isCategoriesLoading } = useCategories()

  // State for filters (unified state) - Initialize from URL params if available
  const [filters, setFilters] = useState<ContractorsFilters>(() => {
    const defaultFilters: ContractorsFilters = {
      page: 1,
      pageSize: 6,
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      // Advanced filters
      location: '',
      typeOfSupport: 'all',
      gender: 'all',
      hasVehicle: 'all',
      workerType: 'all',
      languages: [],
      age: 'all',
      within: 'none',
      // Therapeutic subcategories filter
      therapeuticSubcategories: [],
      // Document filters
      documentCategories: [],
      documentStatuses: [],
      requirementTypes: [],
    }

    // Parse URL params and merge with defaults
    const urlFilters = parseFiltersFromURL(searchParams)
    return { ...defaultFilters, ...urlFilters }
  })

  // Initialize search input from URL as well
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '')

  // Document filter options (fetched from API)
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // Pending advanced filters (not applied until Search button is clicked)
  const [pendingFilters, setPendingFilters] = useState({
    location: filters.location,
    typeOfSupport: filters.typeOfSupport,
    gender: filters.gender,
    hasVehicle: filters.hasVehicle,
    workerType: filters.workerType,
    languages: filters.languages,
    age: filters.age,
    within: filters.within,
    therapeuticSubcategories: filters.therapeuticSubcategories,
  })

  // Pending document filters (not applied yet)
  const [pendingDocFilters, setPendingDocFilters] = useState({
    documentCategories: [] as string[],
    documentStatuses: [] as string[],
    requirementTypes: [] as string[],
  })

  // Contractor modal state (isModalOpen derived from selectedContractor !== null)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showToggleForContractor, setShowToggleForContractor] = useState<string | null>(null)

  // Inactive workers modal state (grouped)
  const [inactiveWorkersState, setInactiveWorkersState] = useState({
    isOpen: false,
    workers: [] as Contractor[],
    isLoading: false,
  })

  // Suburb autocomplete states
  const [suburbSearch, setSuburbSearch] = useState('')
  const [suburbs, setSuburbs] = useState<any[]>([])
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

  // Fetch document filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/admin/filters')
        const result = await response.json()
        if (result.success) {
          setFilterOptions(result.data)
        }
      } catch (error) {
       
      } finally {
        setIsLoadingFilters(false)
      }
    }

    fetchFilterOptions()
  }, [])

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
      if (pendingFilters.typeOfSupport !== 'Therapeutic Supports') {
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

  // Fetch suburbs from API
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
          setSuburbs(data)
          setShowSuburbDropdown(true)
        } else {
          setSuburbs([])
          setShowSuburbDropdown(false)
        }
      } catch (error) {
      
        setSuburbs([])
        setShowSuburbDropdown(false)
      } finally {
        setIsLoadingSuburbs(false)
      }
    }

    const timeoutId = setTimeout(fetchSuburbs, 300) // Debounce for 300ms
    return () => clearTimeout(timeoutId)
  }, [suburbSearch])

  // Sync filters to URL whenever they change
  useEffect(() => {
    const newURL = buildURLFromFilters(filters)
    const currentPath = window.location.pathname
    const newFullURL = currentPath + newURL

    // Only update URL if it's different from current URL
    if (newFullURL !== window.location.pathname + window.location.search) {
      router.replace(newFullURL, { scroll: false })
    }
  }, [filters, router])

  // Fetch contractors using TanStack Query
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['contractors', filters],
    queryFn: () => fetchContractors(filters),
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
    staleTime: 30000, // Cache for 30 seconds
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

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  const closeModal = () => {
    setSelectedContractor(null)
    setShowContactInfo(false)
  }

  const fetchInactiveWorkers = async () => {
    setInactiveWorkersState(prev => ({ ...prev, isLoading: true }))
    try {
      const response = await fetch('/api/admin/contractors/inactive')
      const result = await response.json()
      if (result.success) {
        setInactiveWorkersState({ isOpen: true, workers: result.data, isLoading: false })
      } else {
        setInactiveWorkersState(prev => ({ ...prev, isLoading: false }))
        alert('Failed to fetch inactive workers: ' + result.error)
      }
    } catch (error) {
      console.error('Error fetching inactive workers:', error)
      setInactiveWorkersState(prev => ({ ...prev, isLoading: false }))
      alert('Failed to fetch inactive workers')
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
          workers: prev.workers.filter(w => w.id !== contractorId)
        }))
        // Refresh main list
        queryClient.invalidateQueries({ queryKey: ['contractors'] })
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
    if (!data?.pagination) return null

    const { page, totalPages, hasNext, hasPrev } = data.pagination

    // Generate page numbers to display (max 5)
    const pageNumbers: number[] = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

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

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Filters Sidebar */}
        <aside className="w-[480px] bg-white border-r border-gray-200 min-h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => {
                  const finalLocation = suburbSearch.trim() || pendingFilters.location
                  setFilters(prev => ({
                    ...prev,
                    location: finalLocation,
                    typeOfSupport: pendingFilters.typeOfSupport,
                    gender: pendingFilters.gender,
                    hasVehicle: pendingFilters.hasVehicle,
                    workerType: pendingFilters.workerType,
                    languages: pendingFilters.languages,
                    age: pendingFilters.age,
                    within: pendingFilters.within,
                    therapeuticSubcategories: pendingFilters.therapeuticSubcategories,
                    page: 1
                  }))
                }}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Apply Filters
              </button>
            </div>

            {/* Suburb or postcode */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Suburb
              </label>
              <div className="relative" ref={suburbDropdownRef}>
                <input
                  type="text"
                  value={suburbSearch}
                  onChange={(e) => setSuburbSearch(e.target.value)}
                  onFocus={() => {
                    if (suburbs.length > 0) setShowSuburbDropdown(true)
                  }}
                  placeholder="e.g. Queensland, NSW"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {isLoadingSuburbs && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                  </div>
                )}

                {/* Suburb Dropdown */}
                {showSuburbDropdown && suburbs.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suburbs.map((suburb: any, index: number) => (
                      <button
                        key={`${suburb.name}-${suburb.postcode}-${index}`}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 text-sm"
                        onClick={() => {
                          const selectedValue = `${suburb.name}, ${suburb.state.abbreviation} ${suburb.postcode}`
                          isSuburbSelectedRef.current = true
                          setShowSuburbDropdown(false)
                          setSuburbs([])
                          setPendingFilters(prev => ({ ...prev, location: selectedValue }))
                          setSuburbSearch(selectedValue)
                        }}
                      >
                        <span className="text-gray-900 font-medium">
                          {suburb.name}, {suburb.state.abbreviation} {suburb.postcode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Within (Distance) */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Within
              </label>
              <select
                value={pendingFilters.within}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, within: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="none">Any distance</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            {/* Type of Support */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Type of Support
              </label>
              <select
                value={pendingFilters.typeOfSupport}
                onChange={(e) => setPendingFilters(prev => ({ ...prev, typeOfSupport: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                disabled={isCategoriesLoading}
              >
                <option value="all">All</option>
                {isCategoriesLoading ? (
                  <option disabled>Loading services...</option>
                ) : (
                  categories?.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Therapeutic Subcategories (conditional) */}
            {pendingFilters.typeOfSupport === 'Therapeutic Supports' && (
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
                onChange={(e) => setPendingFilters(prev => ({ ...prev, gender: e.target.value }))}
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
                onChange={(e) => setPendingFilters(prev => ({ ...prev, age: e.target.value }))}
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
                onChange={(e) => setPendingFilters(prev => ({ ...prev, hasVehicle: e.target.value }))}
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
                onChange={(e) => setPendingFilters(prev => ({ ...prev, workerType: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All</option>
                <option value="Employee">Employee</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    pageSize: 6,
                    search: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    location: '',
                    typeOfSupport: 'all',
                    gender: 'all',
                    hasVehicle: 'all',
                    workerType: 'all',
                    languages: [],
                    age: 'all',
                    within: 'none',
                    therapeuticSubcategories: [],
                    documentCategories: [],
                    documentStatuses: [],
                    requirementTypes: [],
                  })
                  setPendingFilters({
                    location: '',
                    typeOfSupport: 'all',
                    gender: 'all',
                    hasVehicle: 'all',
                    workerType: 'all',
                    languages: [],
                    age: 'all',
                    within: 'none',
                    therapeuticSubcategories: [],
                  })
                  setPendingDocFilters({
                    documentCategories: [],
                    documentStatuses: [],
                    requirementTypes: [],
                  })
                  setSearchInput('')
                  setSuburbSearch('')
                  setLanguageSearch('')
                  setTherapeuticSubcategorySearch('')
                }}
                className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Clear All Filters
              </button>

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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Loading contractors...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading contractors</h3>
                  <p className="mt-2 text-sm text-red-700">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && data && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Loading overlay while fetching */}
            {isFetching && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 animate-pulse"></div>
            )}

            {/* Pagination Info at Top */}
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(data.pagination.page - 1) * filters.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(data.pagination.page * filters.pageSize, data.pagination.total)}
                </span>{' '}
                of <span className="font-medium">{data.pagination.total}</span> results
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('firstName')}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100"
                    >
                      Name {filters.sortBy === 'firstName' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                    <th
                      onClick={() => handleSort('city')}
                      className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100"
                    >
                      Location {filters.sortBy === 'city' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No contractors found
                      </td>
                    </tr>
                  ) : (
                    data.data.map((contractor) => (
                      <tr
                        key={contractor.id}
                        onClick={() => setSelectedContractor(contractor)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${!contractor.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {contractor.photos ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={contractor.photos}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium text-sm">
                                    {contractor.firstName?.[0]}
                                    {contractor.lastName?.[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {contractor.firstName} {contractor.lastName}
                                </span>
                                {/* Active Status with Toggle on Click */}
                                <div className="flex items-center gap-1">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowToggleForContractor(
                                        showToggleForContractor === contractor.id ? null : contractor.id
                                      );
                                    }}
                                    className="text-xs text-green-700 font-medium cursor-pointer select-none px-2 py-0.5 bg-green-50 border border-green-200 rounded-full hover:bg-green-100 hover:border-green-300 transition-colors"
                                  >
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
                                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                        contractor.isActive ? 'bg-green-500' : 'bg-gray-300'
                                      } ${toggleStatusMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                                      role="switch"
                                      aria-checked={contractor.isActive}
                                      title={contractor.isActive ? 'Click to deactivate' : 'Click to activate'}
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
                              {contractor.mobile && (
                                <div className="text-sm text-gray-500">
                                  {contractor.mobile}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contractor.distance ? (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {formatTravelTime(contractor.distance)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contractor.city && contractor.state
                              ? `${contractor.city}, ${contractor.state}`
                              : contractor.city || contractor.state || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">{contractor.gender || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contractor.age || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {contractor.services && contractor.services.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {contractor.services.slice(0, 2).map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {service}
                                  </span>
                                ))}
                                {contractor.services.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{contractor.services.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        )}
        </main>
      </div>

      {/* Modal for contractor actions */}
      {selectedContractor && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Contractor Info */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {selectedContractor.photos ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedContractor.photos}
                      alt=""
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium text-lg">
                        {selectedContractor.firstName?.[0]}
                        {selectedContractor.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedContractor.firstName} {selectedContractor.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedContractor.city && selectedContractor.state
                        ? `${selectedContractor.city}, ${selectedContractor.state}${selectedContractor.postalCode ? ` ${selectedContractor.postalCode}` : ''}`
                        : selectedContractor.city || selectedContractor.state || 'Location not specified'}
                    </p>
                  </div>
                </div>

                {/* Services badges */}
                {selectedContractor.services && selectedContractor.services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedContractor.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <a
                  href={`/admin/contractors/${selectedContractor.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </a>

                <a
                  href={`/admin/contractors/${selectedContractor.userId}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Show Profile
                </a>

                <a
                  href={`/admin/contractors/${selectedContractor.id}/compliance`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Show Compliance
                </a>

                <button
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Information
                </button>
              </div>

              {/* Contact Information Display */}
              {showContactInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Details</h4>

                  {selectedContractor.email && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <a href={`mailto:${selectedContractor.email}`} className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline">
                          {selectedContractor.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedContractor.mobile && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <a href={`tel:${selectedContractor.mobile}`} className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline">
                          {selectedContractor.mobile}
                        </a>
                      </div>
                    </div>
                  )}

                  {!selectedContractor.email && !selectedContractor.mobile && (
                    <p className="text-sm text-gray-500 italic">No contact information available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  Inactive Workers ({inactiveWorkersState.workers.length})
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
                          {worker.photos ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={worker.photos}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-sm">
                                {worker.firstName?.[0]}{worker.lastName?.[0]}
                              </span>
                            </div>
                          )}
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
