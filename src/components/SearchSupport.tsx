'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCategories } from '@/hooks/queries/useCategories'

interface Contractor {
  id: string
  firstName: string
  lastName: string
  titleRole: string | null
  aboutYou: string | null
  profilePicture: string | null
  distance?: number // Distance in km (only available for distance-based searches)
}

export default function SearchSupport() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch categories from database
  const { data: categories, isLoading: isCategoriesLoading } = useCategories()

  // Search form state
  const [location, setLocation] = useState('')
  const [supportType, setSupportType] = useState('All')
  const [gender, setGender] = useState('All')
  const [distance, setDistance] = useState('0')
  const [error, setError] = useState('')

  // Show more/less state
  const [showAll, setShowAll] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Fetch contractors from API
  const fetchContractors = async (searchParams?: {
    location?: string
    supportType?: string
    gender?: string
    distance?: string
  }, isInitialLoad: boolean = false) => {
    try {
      setIsLoading(true)
      setShowAll(false) // Reset to show only 6 on new search

      // Build query parameters
      const params = new URLSearchParams()
      // On initial load, only fetch 6. On search, fetch 50 to enable "See More"
      params.append('limit', isInitialLoad ? '6' : '50')

      // Add flexible location filter (handles "NSW 2148", "Parramatta", "2148", etc.)
      if (searchParams?.location && searchParams.location.trim()) {
        params.append('location', searchParams.location.trim())
      }

      if (searchParams?.supportType && searchParams.supportType !== 'All') {
        params.append('supportType', searchParams.supportType)
      }

      if (searchParams?.gender && searchParams.gender !== 'All') {
        params.append('gender', searchParams.gender)
      }

      // Add distance filter (only if location is provided and distance is not "0" / "None")
      if (searchParams?.distance && searchParams.distance !== '0' && searchParams.location && searchParams.location.trim()) {
        params.append('distance', searchParams.distance)
      }

      // Fetch data
      const response = await fetch(`/api/contractors?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.contractors) {
        setContractors(data.contractors)
      }
    } catch (error) {
      console.error('Failed to fetch contractors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load - fetch first 6 contractors
  useEffect(() => {
    fetchContractors(undefined, true) // true = initial load
  }, [])

  // Scroll to section when coming back from worker profile
  useEffect(() => {
    const shouldScroll = sessionStorage.getItem('scrollToCarousel')
    if (shouldScroll === 'true') {
      sessionStorage.removeItem('scrollToCarousel')
      const element = document.getElementById('find-support')
      if (element) {
        element.scrollIntoView({ behavior: 'instant' })
      }
    }
  }, [])

  // Handle search button click
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setError('')

    // Validate: if distance is selected (not "0"), require location
    if (distance !== '0' && !location.trim()) {
      setError('Please enter a suburb or postcode when using distance filter')
      return
    }

    // Mark that a search has been performed
    setHasSearched(true)

    fetchContractors({
      location,
      supportType,
      gender,
      distance,
    }, false) // false = not initial load, fetch up to 50
  }

  return (
    <section id="find-support" className="bg-white pt-4 pb-4 sm:py-16 md:py-20 lg:py-24 overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">FIND SUPPORT</span>
          </p>
          <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-[#0C1628] mb-2 sm:mb-8">
            Search for NDIS disability workers in your area
          </h2>
          <p className="font-sans text-base sm:text-lg lg:text-xl text-[#0C1628] leading-relaxed max-w-4xl mx-auto">
            Meet a few of the amazing disability support workers making a difference every day.
          </p>
        </div>


        {/* Search Feature */}
        <form onSubmit={handleSearch} className="bg-gray-50 rounded-2xl shadow-lg p-5 mb-16 mx-25">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

            <div className="md:col-span-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Suburb or postcode
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Queensland, NSW 2148, or VIC"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>


            <div className="md:col-span-1">
              <label htmlFor="support-type" className="block text-sm font-medium text-gray-700 mb-2">
                Type of Support
              </label>
              <select
                id="support-type"
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCategoriesLoading}
              >
                <option value="All">All</option>
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


            <div className="md:col-span-1">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>


            <div className="md:col-span-1">
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                Within
              </label>
              <select
                id="distance"
                value={distance}
                onChange={(e) => {
                  const newDistance = e.target.value
                  setDistance(newDistance)
                  // Clear location when "None" is selected
                  if (newDistance === '0') {
                    setLocation('')
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0">None</option>
                <option value="5">5km</option>
                <option value="10">10km</option>
                <option value="20">20km</option>
                <option value="50">50km</option>
                <option value="100">100km</option>
              </select>
            </div>


            <div className="md:col-span-1">
              <button
                type="submit"
                className="w-full bg-[#0C1628] hover:bg-[#B1C3CD] hover:text-[#0C1628] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Contractor Cards */}
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C1628]"></div>
            </div>
          ) : contractors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                {hasSearched
                  ? "Didn't find a worker? Be more specific (e.g., QLD 4021, Sydney NSW)"
                  : "No contractors available at the moment."}
              </p>
            </div>
          ) : (
            <>
              {/* First 6 Contractors (Always Visible) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                {contractors.slice(0, 6).map((contractor) => (
                  <a
                    key={contractor.id}
                    href={`/workers/${contractor.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row p-6 gap-6"
                  >
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <Image
                          src={contractor.profilePicture || '/images/profilePlaceHolder.png'}
                          alt={`${contractor.firstName} ${contractor.lastName.charAt(0)}. - Support Worker`}
                          fill
                          className="object-cover"
                          sizes="80px"
                          priority
                        />
                      </div>
                      {/* Star Rating - Placeholder for now */}
                      <div className="flex gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 fill-orange-400" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Contractor Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name: First Name + Last Initial */}
                      <h3 className="text-2xl font-bold text-[#0C1628] font-cooper mb-1">
                        {contractor.firstName} {contractor.lastName.charAt(0)}.
                      </h3>

                      {/* Title Role */}
                      {contractor.titleRole && (
                        <p className="text-sm text-gray-600 font-poppins mb-3">
                          {contractor.titleRole}
                        </p>
                      )}

                      {/* About You */}
                      {contractor.aboutYou && (
                        <p className="text-sm text-gray-700 font-poppins leading-relaxed line-clamp-2 mb-3">
                          {contractor.aboutYou}
                        </p>
                      )}

                      {/* Distance (only shown for location-based searches) */}
                      {contractor.distance !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-500 font-poppins">
                            {contractor.distance < 1
                              ? `${Math.round(contractor.distance * 1000)}m away`
                              : `${contractor.distance}km away`}
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              {/* Additional Contractors (Expandable with dropdown animation) */}
              {contractors.length > 6 && (
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-6 px-2 overflow-hidden transition-all duration-500 ease-in-out ${
                    showAll ? 'max-h-[10000px] opacity-100 mt-6' : 'max-h-0 opacity-0'
                  }`}
                >
                  {contractors.slice(6).map((contractor) => (
                    <a
                      key={contractor.id}
                      href={`/workers/${contractor.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row p-6 gap-6"
                    >
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <Image
                            src={contractor.profilePicture || '/images/profilePlaceHolder.png'}
                            alt={`${contractor.firstName} ${contractor.lastName.charAt(0)}. - Support Worker`}
                            fill
                            className="object-cover"
                            sizes="80px"
                            priority
                          />
                        </div>
                        {/* Star Rating - Placeholder for now */}
                        <div className="flex gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3 h-3 fill-orange-400" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      {/* Contractor Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name: First Name + Last Initial */}
                        <h3 className="text-2xl font-bold text-[#0C1628] font-cooper mb-1">
                          {contractor.firstName} {contractor.lastName.charAt(0)}.
                        </h3>

                        {/* Title Role */}
                        {contractor.titleRole && (
                          <p className="text-sm text-gray-600 font-poppins mb-3">
                            {contractor.titleRole}
                          </p>
                        )}

                        {/* About You */}
                        {contractor.aboutYou && (
                          <p className="text-sm text-gray-700 font-poppins leading-relaxed line-clamp-2 mb-3">
                            {contractor.aboutYou}
                          </p>
                        )}

                        {/* Distance (only shown for location-based searches) */}
                        {contractor.distance !== undefined && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-500 font-poppins">
                              {contractor.distance < 1
                                ? `${Math.round(contractor.distance * 1000)}m away`
                                : `${contractor.distance}km away`}
                            </span>
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* See More / See Less Button - Only show after search is performed */}
              {hasSearched && contractors.length > 6 && (
                <div className="mt-8 flex justify-start px-2">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center gap-2 text-[#0C1628] hover:text-[#B1C3CD] font-medium text-base transition-colors duration-200"
                  >
                    {showAll ? (
                      <>
                        <span>See Less</span>
                        <svg
                          className="w-5 h-5 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>See More ({contractors.length - 6} more)</span>
                        <svg
                          className="w-5 h-5 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
