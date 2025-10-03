'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Contractor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  profileImage: string | null
  title: string | null
  companyName: string | null
  yearsOfExperience: number | null
  skills: string[]
  specializations: string[]
  city: string | null
  state: string | null
  postcode: string | null
  photoSubmission: string | null // Vercel Blob URL
  profileTitle: string | null
  qualificationsAndCerts: string | null
  servicesOffered: string[]
}

interface Worker {
  id: string
  name: string
  image: string
  profileTitle: string | null
  introduction: string | null
  servicesOffered: string[]
}

export default function SearchSupport() {
  const [location, setLocation] = useState('')
  const [supportType, setSupportType] = useState('All')
  const [distance, setDistance] = useState('20km')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])

  // Fetch contractors from API
  useEffect(() => {
    async function fetchContractors() {
      try {
        setIsLoading(true)
        // Fetch all contractors to filter those with photos, then limit to 12
        const response = await fetch('/api/contractors?limit=all')
        const data = await response.json()

        if (data.contractors) {
          setContractors(data.contractors)

          // Transform contractors with photos to workers format and limit to 12
          const transformedWorkers: Worker[] = data.contractors
            .filter((c: Contractor) => c.photoSubmission)
            .slice(0, 12)
            .map((c: Contractor) => ({
              id: c.id,
              name: `${c.firstName} ${c.lastName.charAt(0)}.`,
              image: c.photoSubmission!,
              profileTitle: c.profileTitle,
              introduction: c.qualificationsAndCerts,
              servicesOffered: c.servicesOffered || []
            }))

          setWorkers(transformedWorkers)
        }
      } catch {
        // Error handled silently - show empty state
      } finally {
        setIsLoading(false)
      }
    }

    fetchContractors()
  }, [])

  // Scroll to carousel when coming back from worker profile
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

  const totalSlides = Math.ceil(workers.length / 3)

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


        {/* <div className="bg-gray-50 rounded-2xl shadow-lg p-6 mb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      
            <div className="md:col-span-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Suburb or postcode
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g Sydney, NSW 2000"
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
              >
                <option value="All">All</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Community Access">Community Access</option>
                <option value="Household Tasks">Household Tasks</option>
                <option value="Transport">Transport</option>
                <option value="Social Support">Social Support</option>
              </select>
            </div>

           
            <div className="md:col-span-1">
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                Within
              </label>
              <select
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5km">5km</option>
                <option value="10km">10km</option>
                <option value="20km">20km</option>
                <option value="50km">50km</option>
                <option value="100km">100km</option>
              </select>
            </div>

           
            <div className="md:col-span-1">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                Search
              </button>
            </div>
          </div>
        </div> */}

        {/* Worker Cards Carousel */}
        <div className="relative">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C1628]"></div>
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No contractors available at the moment.</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden pb-4">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                    <div key={slideIndex} className="min-w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 px-2">
                        {workers.slice(slideIndex * 3, slideIndex * 3 + 3).map((worker) => (
                      <div key={worker.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        {/* Worker Image */}
                        <div className="relative h-80 sm:h-96 lg:h-[450px]">
                          <Image
                            src={worker.image}
                            alt={`${worker.name} - Support Worker`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority={currentSlide === Math.floor(workers.indexOf(worker) / 3)}
                          />
                        </div>

                        {/* Worker Info */}
                        <div className="p-6 lg:p-8 space-y-4">
                          {/* Name */}
                          <h3 className="text-2xl lg:text-3xl font-bold text-[#0C1628] font-cooper">
                            {worker.name}
                          </h3>

                          {/* Profile Title */}
                          {worker.profileTitle && (
                            <p className="text-lg lg:text-xl text-gray-700 font-poppins">
                              {worker.profileTitle}
                            </p>
                          )}

                          {/* Introduction */}
                          {worker.introduction && (
                            <p className="text-base text-gray-600 font-poppins leading-relaxed line-clamp-2">
                              {worker.introduction}
                            </p>
                          )}

                          {/* Services Offered */}
                          {worker.servicesOffered && worker.servicesOffered.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {worker.servicesOffered.slice(0, 4).map((service, index) => (
                                <span key={index} className="px-3 py-1 border border-[#0C1628] rounded-full text-sm font-poppins">
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* More Details Button */}
                          <a
                            href={`/workers/${worker.id}`}
                            className="block w-full bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins font-medium py-3 px-6 rounded-full transition-colors duration-200 mt-4 text-center"
                          >
                            More Details
                          </a>
                        </div>
                      </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Controls and Dot Indicators */}
              <div className="flex items-center justify-between mt-8">
            {/* Empty spacer for alignment */}
            <div className="flex-1"></div>

            {/* Dot Indicators - Centered */}
            <div className="flex justify-center gap-2 flex-1">
              {[...Array(totalSlides)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-[#0C1628] w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons - Right */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="w-10 h-10 rounded-full border-2 border-[#0C1628] flex items-center justify-center hover:bg-[#0C1628] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Button */}
              <button
                onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
                disabled={currentSlide === totalSlides - 1}
                className="w-10 h-10 rounded-full border-2 border-[#0C1628] flex items-center justify-center hover:bg-[#0C1628] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}