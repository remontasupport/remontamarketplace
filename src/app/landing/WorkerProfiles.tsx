'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import { getFeaturedWorkerProfiles, WorkerProfile } from '@/lib/sanity/workerProfileClient'
import WorkerProfileModal from './WorkerProfileModal'
import 'swiper/css'
import 'swiper/css/navigation'
import '../styles/worker-profiles.css'

// Define background colors for the cards
const backgroundColors = [
  '#E6A965', // Orange
  '#8EBFD9', // Blue
  '#C5A8D4', // Purple
  '#E6A965', // Orange (repeat pattern)
]

export default function WorkerProfiles() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchWorkers() {
      const data = await getFeaturedWorkerProfiles()
      console.log('Worker Profiles fetched:', data.length, 'workers')
      setWorkers(data)
      setLoading(false)
    }
    fetchWorkers()
  }, [])

  // Handle modal open
  const handleCardClick = (worker: WorkerProfile, index: number) => {
    setSelectedWorker(worker)
    setIsModalOpen(true)
    document.body.classList.add('modal-open')
  }

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWorker(null)
    document.body.classList.remove('modal-open')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  // Don't render until we have data
  if (loading || !workers || workers.length === 0) {
    return null
  }

  return (
    <section className="worker-profiles-section">
      <div className="worker-profiles-container">
        {/* Header */}
        <div className="worker-profiles-header">
          <h2 className="section-title">
            Meet a few of our amazing support workers
          </h2>
          <Link href="/search-workers" className="worker-profiles-find-more desktop-only">
            Find more
          </Link>
        </div>

        {/* Swiper Container with Navigation and Gradients */}
        <div className="worker-profiles-slider-wrapper">
          {/* Left Gradient Overlay */}
          <div className="worker-profiles-gradient-left"></div>

          {/* Right Gradient Overlay */}
          <div className="worker-profiles-gradient-right"></div>

          {/* Left Navigation Arrow */}
          <button type="button" className="worker-profiles-button-prev" aria-label="Previous worker profile">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Navigation Arrow */}
          <button type="button" className="worker-profiles-button-next" aria-label="Next worker profile">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Swiper Slider */}
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
              320: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 2,
                slidesPerGroup: 1,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 4,
                slidesPerGroup: 1,
                spaceBetween: 16,
              },
            }}
            watchOverflow={true}
            className="worker-profiles-swiper"
          >
          {workers.map((worker: WorkerProfile, index: number) => (
            <SwiperSlide key={worker._id}>
              <div
                className="worker-profile-card"
                onClick={() => handleCardClick(worker, index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(worker, index)
                  }
                }}
              >
                {/* Image Container with Background Color */}
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

                {/* Card Content */}
                <div className="worker-profile-content">
                  {/* Label */}
                  <p className="worker-profile-label">SUPPORT WORKER</p>

                  {/* Name with Arrow */}
                  <h3 className="worker-profile-name">
                    {worker.name}
                    <span className="worker-profile-arrow">▸</span>
                  </h3>

                  {/* Job Role */}
                  <p className="worker-profile-role">{worker.jobRole}</p>

                  {/* Bio */}
                  <p className="worker-profile-bio">{worker.bio}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
          </Swiper>
        </div>

        {/* Find More Button (Mobile Only) */}
        <Link href="/search-workers" className="worker-profiles-find-more mobile-only">
          Find more
        </Link>

        {/* Worker Profile Modal */}
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
    </section>
  )
}
