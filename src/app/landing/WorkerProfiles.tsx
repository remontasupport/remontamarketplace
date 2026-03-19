'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import { getFeaturedWorkerProfiles, WorkerProfile } from '@/lib/sanity/workerProfileClient'
import WorkerProfileModal from './WorkerProfileModal'
import { BRAND_COLORS } from '@/lib/constants'
import 'swiper/css'
import 'swiper/css/navigation'
import '@/styles/worker-profiles.css'

const backgroundColors = [
  '#E6A965',
  '#8EBFD9',
  '#C5A8D4',
  '#E6A965',
]

export default function WorkerProfiles() {
  const router = useRouter()
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Search state
  const [location, setLocation] = useState('')
  const [supportType, setSupportType] = useState('All')
  const [within, setWithin] = useState('20')

  useEffect(() => {
    async function fetchWorkers() {
      const data = await getFeaturedWorkerProfiles()
      setWorkers(data)
      setLoading(false)
    }
    fetchWorkers()
  }, [])

  const handleCardClick = (worker: WorkerProfile) => {
    setSelectedWorker(worker)
    setIsModalOpen(true)
    document.body.classList.add('modal-open')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWorker(null)
    document.body.classList.remove('modal-open')
  }

  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location.trim()) params.append('location', location.trim())
    if (supportType !== 'All') params.append('supportType', supportType)
    if (within !== '0') params.append('distance', within)
    router.push(`/find-support?${params.toString()}`)
  }

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">

        {/* Main heading */}
        <h2 className="section-title mb-6">
          Search for NDIS disability &amp; aged care support workers in your area
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
          Search and filter trusted and verified workers by location, support types, and more to find the perfect fit for you.
        </p>

        {/* Unified search bar */}
        <form
          onSubmit={handleSearch}
          className="inline-flex flex-col md:flex-row items-stretch rounded-2xl border-2 overflow-hidden shadow-sm mb-20"
          style={{ borderColor: BRAND_COLORS.PRIMARY }}
        >
          {/* Suburb or postcode */}
          <div className="flex flex-col justify-center px-5 py-4 text-left border-b md:border-b-0 md:border-r border-gray-200 w-auto">
            <label className="text-xs font-bold text-[#0C1628] mb-1">Suburb or postcode</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sydney NSW 2000"
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Type of Support */}
          <div className="flex flex-col justify-center px-5 py-4 text-left border-b md:border-b-0 md:border-r border-gray-200 w-auto">
            <label className="text-xs font-bold text-[#0C1628] mb-1">Type of Support</label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Support Worker">Support Worker</option>
              <option value="Support Worker (High Intensity)">Support Worker (High Intensity)</option>
              <option value="Cleaning Services">Cleaning Services</option>
              <option value="Home and Yard Maintenance">Home and Yard Maintenance</option>
              <option value="Therapeutic Supports">Therapeutic Supports</option>
              <option value="Nursing Services">Nursing Services</option>
            </select>
          </div>

          {/* Within */}
          <div className="flex flex-col justify-center px-5 py-4 text-left border-b md:border-b-0 md:border-r border-gray-200">
            <label className="text-xs font-bold text-[#0C1628] mb-1">Within</label>
            <select
              value={within}
              onChange={(e) => setWithin(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="5">5km</option>
              <option value="10">10km</option>
              <option value="20">20km</option>
              <option value="50">50km</option>
              <option value="100">100km</option>
            </select>
          </div>

          {/* Search button */}
          <div className="flex items-center justify-center px-3 py-3">
            <button
              type="submit"
              className="px-10 py-4 text-white font-semibold text-base rounded-xl transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
            >
              Search
            </button>
          </div>
        </form>

      </div>

      {/* Worker Profiles Carousel */}
      {!loading && workers && workers.length > 0 && (
        <div className="worker-profiles-container">
          <div className="worker-profiles-slider-wrapper">
            <div className="worker-profiles-gradient-left"></div>
            <div className="worker-profiles-gradient-right"></div>

            <button type="button" className="worker-profiles-button-prev" aria-label="Previous worker profile">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button type="button" className="worker-profiles-button-next" aria-label="Next worker profile">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <Swiper
              modules={[Navigation]}
              spaceBetween={16}
              slidesPerView={4}
              slidesPerGroup={1}
              loop={false}
              navigation={{
                prevEl: '.worker-profiles-button-prev',
                nextEl: '.worker-profiles-button-next',
                disabledClass: 'swiper-button-disabled',
              }}
              breakpoints={{
                320: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 16 },
                640: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 16 },
                1024: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 16 },
              }}
              watchOverflow={true}
              className="worker-profiles-swiper"
            >
              {workers.map((worker: WorkerProfile, index: number) => (
                <SwiperSlide key={worker._id}>
                  <div
                    className="worker-profile-card"
                    onClick={() => handleCardClick(worker)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleCardClick(worker)
                      }
                    }}
                  >
                    <div
                      className="worker-profile-image-wrapper"
                      style={{ backgroundColor: backgroundColors[index % backgroundColors.length] }}
                    >
                      {worker.imageUrl && (
                        <Image
                          src={worker.imageUrl}
                          alt={worker.imageAlt || worker.name}
                          fill
                          className="worker-profile-image"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                        />
                      )}
                    </div>

                    <div className="worker-profile-content">
                      <p className="worker-profile-label">SUPPORT WORKER</p>
                      <h3 className="worker-profile-name">
                        {worker.name}
                        <span className="worker-profile-arrow">▸</span>
                      </h3>
                      <p className="worker-profile-role">{worker.jobRole}</p>
                      <p className="worker-profile-bio">{worker.bio}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <WorkerProfileModal
            worker={selectedWorker}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            backgroundColor={
              selectedWorker
                ? backgroundColors[workers.indexOf(selectedWorker) % backgroundColors.length]
                : backgroundColors[0]
            }
          />
        </div>
      )}
    </section>
  )
}
