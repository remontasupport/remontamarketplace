'use client'

import { useState, useCallback } from 'react'
import { useWorkers, usePrefetchWorkers, WorkersSearchParams } from '@/hooks/queries/useWorkers'
import WorkerCardGrid from './WorkerCardGrid'
import WorkerSearchBar from './WorkerSearchBar'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface WorkerSearchResultsProps {
  initialSearch?: string
  initialLocation?: string
}

export default function WorkerSearchResults({
  initialSearch = '',
  initialLocation = '',
}: WorkerSearchResultsProps) {
  // Search state
  const [searchParams, setSearchParams] = useState<WorkersSearchParams>({
    page: 1,
    pageSize: 20,
    search: initialSearch || undefined,
    location: initialLocation || undefined,
  })

  // Fetch workers
  const { data, isLoading, error, isFetching } = useWorkers(searchParams)
  const prefetch = usePrefetchWorkers()

  // Handle search
  const handleSearch = useCallback((keywords: string, location: string) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1, // Reset to first page on new search
      search: keywords || undefined,
      location: location || undefined,
    }))
  }, [])

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: newPage,
    }))

    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Prefetch next/previous pages on hover
  const handlePrefetchPage = useCallback((page: number) => {
    if (page > 0 && page <= (data?.pagination.totalPages || 1)) {
      prefetch({ ...searchParams, page })
    }
  }, [prefetch, searchParams, data?.pagination.totalPages])

  // Handle view profile
  const handleViewProfile = useCallback((workerId: string) => {
    // TODO: Navigate to worker profile page
    console.log('View profile:', workerId)
  }, [])

  // Handle contact
  const handleContact = useCallback((workerId: string) => {
    // TODO: Open contact modal or navigate to messaging
    console.log('Contact worker:', workerId)
  }, [])

  // Transform API data to match WorkerCard interface
  const workers = data?.data.map(worker => ({
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    photo: worker.photo,
    role: worker.role,
    bio: worker.bio,
    skills: worker.skills,
    location: worker.location,
    isNdisCompliant: worker.isNdisCompliant,
  })) || []

  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="px-0 md:px-8 lg:px-16">
        <WorkerSearchBar onSearch={handleSearch} />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-poppins font-semibold text-xl text-gray-900">
            {searchParams.search || searchParams.location
              ? 'Search Results'
              : 'Recommended Support Workers'}
          </h2>
          {pagination && (
            <p className="font-poppins text-sm text-gray-500 mt-1">
              {pagination.total} {pagination.total === 1 ? 'worker' : 'workers'} found
              {isFetching && !isLoading && (
                <span className="ml-2 text-blue-500">Updating...</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-poppins text-sm text-red-600">
            {error.message || 'Failed to load workers. Please try again.'}
          </p>
        </div>
      )}

      {/* Worker Cards */}
      <WorkerCardGrid
        workers={workers}
        isLoading={isLoading}
        onViewProfile={handleViewProfile}
        onContact={handleContact}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            onMouseEnter={() => handlePrefetchPage(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="flex items-center gap-1 px-4 py-2 rounded-lg font-poppins text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          {/* Page Info */}
          <span className="font-poppins text-sm text-gray-600 px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            onMouseEnter={() => handlePrefetchPage(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center gap-1 px-4 py-2 rounded-lg font-poppins text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
