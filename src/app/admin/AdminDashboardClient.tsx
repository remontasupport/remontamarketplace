'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCategories } from '@/hooks/queries/useCategories'

// ============================================================================
// TYPES
// ============================================================================

interface Contractor {
  id: string
  userId: string
  firstName: string
  lastName: string
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
  languages: string[]
  age: string
  within: string

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

  // Text search
  if (filters.search) {
    params.append('search', filters.search)
  }

  // Advanced filters - only add if they have values
  if (filters.location) {
    params.append('location', filters.location)
  }

  if (filters.typeOfSupport && filters.typeOfSupport !== 'all') {
    params.append('typeOfSupport', filters.typeOfSupport)
  }

  if (filters.gender && filters.gender !== 'all') {
    params.append('gender', filters.gender)
  }

  if (filters.languages && filters.languages.length > 0) {
    params.append('languages', filters.languages.join(','))
  }

  if (filters.age && filters.age !== 'all') {
    params.append('age', filters.age)
  }

  if (filters.within && filters.within !== 'none') {
    params.append('within', filters.within)
  }

  // Document filters (NEW)
  if (filters.documentCategories && filters.documentCategories.length > 0) {
    params.append('documentCategories', filters.documentCategories.join(','))
  }

  if (filters.documentStatuses && filters.documentStatuses.length > 0) {
    params.append('documentStatuses', filters.documentStatuses.join(','))
  }

  if (filters.requirementTypes && filters.requirementTypes.length > 0) {
    params.append('requirementTypes', filters.requirementTypes.join(','))
  }

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

  // Fetch categories from database
  const { data: categories, isLoading: isCategoriesLoading } = useCategories()

  // State for filters (unified state)
  const [filters, setFilters] = useState<ContractorsFilters>({
    page: 1,
    pageSize: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    // Advanced filters
    location: '',
    typeOfSupport: 'all',
    gender: 'all',
    languages: [],
    age: 'all',
    within: 'none',
    // Document filters
    documentCategories: [],
    documentStatuses: [],
    requirementTypes: [],
  })

  const [searchInput, setSearchInput] = useState('')

  // Document filter options (fetched from API)
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // Pending document filters (not applied yet)
  const [pendingDocFilters, setPendingDocFilters] = useState({
    documentCategories: [] as string[],
    documentStatuses: [] as string[],
    requirementTypes: [] as string[],
  })

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)

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
        console.error('Failed to fetch filter options:', error)
      } finally {
        setIsLoadingFilters(false)
      }
    }

    fetchFilterOptions()
  }, [])

  // Close suburb dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suburbDropdownRef.current && !suburbDropdownRef.current.contains(event.target as Node)) {
        setShowSuburbDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        console.error('Error fetching suburbs:', error)
        setSuburbs([])
        setShowSuburbDropdown(false)
      } finally {
        setIsLoadingSuburbs(false)
      }
    }

    const timeoutId = setTimeout(fetchSuburbs, 300) // Debounce for 300ms
    return () => clearTimeout(timeoutId)
  }, [suburbSearch])

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
    setIsModalOpen(false)
    setSelectedContractor(null)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage contractor profiles</p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col gap-4">
            {/* Search by Name/Email */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or mobile..."
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Search
              </button>
            </form>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Suburb or postcode with Autocomplete */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Suburb or postcode
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
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                            setFilters(prev => ({ ...prev, location: selectedValue, page: 1 }))
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

              {/* Type of Support */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Type of Support
                </label>
                <select
                  value={filters.typeOfSupport}
                  onChange={(e) => setFilters(prev => ({ ...prev, typeOfSupport: e.target.value, page: 1 }))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
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

              {/* Gender */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value, page: 1 }))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Within (Distance) */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Within
                </label>
                <select
                  value={filters.within}
                  onChange={(e) => setFilters(prev => ({ ...prev, within: e.target.value, page: 1 }))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="none">None</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="50">50 km</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    // Reset to first page when applying filters
                    setFilters(prev => ({ ...prev, page: 1 }))
                  }}
                  className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 h-[42px]"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Languages and Age Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Languages - Multi-select with Search */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Languages
                </label>
                <div className="relative" ref={languageDropdownRef}>
                  {/* Selected Languages Display */}
                  <div
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="min-h-[42px] rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer"
                  >
                    {filters.languages.length === 0 ? (
                      <span className="text-gray-400">All languages</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {filters.languages.map((lang) => (
                          <span
                            key={lang}
                            className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-medium"
                          >
                            {lang}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFilters(prev => ({
                                  ...prev,
                                  languages: prev.languages.filter(l => l !== lang),
                                  page: 1
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

                  {/* Dropdown */}
                  {showLanguageDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                      {/* Search Input */}
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

                      {/* Language List */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredLanguages.map((language) => (
                          <button
                            key={language}
                            type="button"
                            onClick={() => {
                              const isSelected = filters.languages.includes(language)
                              setFilters(prev => ({
                                ...prev,
                                languages: isSelected
                                  ? prev.languages.filter(l => l !== language)
                                  : [...prev.languages, language],
                                page: 1
                              }))
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                              filters.languages.includes(language)
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{language}</span>
                              {filters.languages.includes(language) && (
                                <span className="text-indigo-600">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                        {filteredLanguages.length === 0 && (
                          <div className="px-4 py-3 text-gray-500 text-center text-sm">
                            No languages found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Age */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <select
                  value={filters.age}
                  onChange={(e) => setFilters(prev => ({ ...prev, age: e.target.value, page: 1 }))}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All</option>
                  <option value="20-30">20-30</option>
                  <option value="31-45">31-45</option>
                  <option value="46-60">46-60</option>
                  <option value="60+">60 above</option>
                </select>
              </div>
            </div>

            {/* Document Filters Section */}
            {!isLoadingFilters && filterOptions && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Document Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Document Statuses */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Document Status
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pendingDocFilters.documentStatuses.length === 0}
                          onChange={() => setPendingDocFilters(prev => ({ ...prev, documentStatuses: [] }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 font-medium">All</span>
                      </label>
                      {filterOptions.documentStatuses.map((status: any) => (
                        <label key={status.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={pendingDocFilters.documentStatuses.includes(status.value)}
                            onChange={(e) => {
                              const isChecked = e.target.checked
                              setPendingDocFilters(prev => ({
                                ...prev,
                                documentStatuses: isChecked
                                  ? [...prev.documentStatuses, status.value]
                                  : prev.documentStatuses.filter(s => s !== status.value)
                              }))
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Requirement Types */}
                  {filterOptions.requirementTypes.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Requirement Types
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={pendingDocFilters.requirementTypes.length === 0}
                            onChange={() => setPendingDocFilters(prev => ({ ...prev, requirementTypes: [] }))}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">All</span>
                        </label>
                        {filterOptions.requirementTypes.map((type: any) => (
                          <label key={type.value} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={pendingDocFilters.requirementTypes.includes(type.value)}
                              onChange={(e) => {
                                const isChecked = e.target.checked
                                setPendingDocFilters(prev => ({
                                  ...prev,
                                  requirementTypes: isChecked
                                    ? [...prev.requirementTypes, type.value]
                                    : prev.requirementTypes.filter(t => t !== type.value)
                                }))
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply Document Filters Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        documentCategories: pendingDocFilters.documentCategories,
                        documentStatuses: pendingDocFilters.documentStatuses,
                        requirementTypes: pendingDocFilters.requirementTypes,
                        page: 1
                      }))
                    }}
                    className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Document Filters
                  </button>
                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    pageSize: 20,
                    search: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    location: '',
                    typeOfSupport: 'all',
                    gender: 'all',
                    languages: [],
                    age: 'all',
                    within: 'none',
                    documentCategories: [],
                    documentStatuses: [],
                    requirementTypes: [],
                  })
                  setPendingDocFilters({
                    documentCategories: [],
                    documentStatuses: [],
                    requirementTypes: [],
                  })
                  setSearchInput('')
                  setSuburbSearch('')
                  setLanguageSearch('')
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
            </div>
          </div>
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
                        onClick={() => {
                          setSelectedContractor(contractor)
                          setIsModalOpen(true)
                        }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {contractor.photos && contractor.photos.length > 0 ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={contractor.photos[0]}
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
                              <div className="text-sm font-medium text-gray-900">
                                {contractor.firstName} {contractor.lastName}
                              </div>
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
      </div>

      {/* Modal for contractor actions */}
      {isModalOpen && selectedContractor && (
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
                  {selectedContractor.photos && selectedContractor.photos.length > 0 ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedContractor.photos[0]}
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
                        ? `${selectedContractor.city}, ${selectedContractor.state}`
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
                <button
                  onClick={() => {
                    router.push(`/admin/contractors/${selectedContractor.id}`)
                    closeModal()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>

                <button
                  onClick={() => {
                    router.push(`/admin/contractors/${selectedContractor.id}/compliance`)
                    closeModal()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Show Compliance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
