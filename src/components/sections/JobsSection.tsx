'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Users, MapPin, X } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

const SERVICE_OPTIONS = [
  'Support Work',
  'Cleaning',
  'Yard Maintenance',
]

// Job type matching https://app.remontaservices.com.au/api/jobs
type Job = {
  id: string
  zohoId: string
  recruitmentTitle: string
  service: string
  jobDescription: string
  city: string | null
  state: string | null
  postedAt: string | null
  createdAt: string
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch jobs')
  }

  return data.jobs
}

// Split array into chunks of n
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

function JobCard({ job, onApply }: { job: Job; onApply: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const location = [job.city, job.state].filter(Boolean).join(', ') || 'Remote'
  const postedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-card-logo">
          <Users size={24} />
        </div>

        <div className="job-card-info">
          <div className="job-card-title-row">
            <div>
              <h3 className="job-card-title">{job.recruitmentTitle}</h3>
            </div>
          </div>

          <div className="job-card-location">
            <MapPin size={20} />
            <span>{location}</span>
          </div>
        </div>
      </div>

      <div className="job-card-badges">
        <span className="job-badge job-badge-active">{job.service}</span>
      </div>

      <div className="job-card-meta">
        <div className="job-card-meta-item">
          <span><span className="job-card-meta-label">Posted:</span> {postedDate}</span>
        </div>
      </div>

      <div className="job-card-description-section">
        <p className="job-card-description-label">Job Description:</p>
        <p className={`job-card-description${expanded ? ' job-card-description--expanded' : ''}`}>
          {job.jobDescription || 'No description available'}
        </p>
        <button className="job-card-see-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'See less' : 'See more'}
        </button>
      </div>

      <button className="job-apply-button" onClick={onApply}>Apply Now</button>
    </div>
  )
}

export default function JobsSection() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')
  const [searchArea, setSearchArea] = useState('')
  const [resolvedState, setResolvedState] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Debounced geocode lookup — resolves suburb/city to Australian state
  useEffect(() => {
    setResolvedState(null)
    if (!searchArea.trim()) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchArea)}`)
        const { state } = await res.json()
        setResolvedState(state ?? null)
      } catch {
        // silently fail — direct substring match still works
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchArea])

  const { data: jobs, error, isLoading } = useSWR<Job[]>('/api/jobs', fetcher, {
    dedupingInterval: 300000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
  })

  // Filter + sort
  const filteredJobs = (jobs ?? [])
    .filter((job) => {
      const matchesService = selectedService
        ? job.service?.toLowerCase().includes(selectedService.toLowerCase())
        : true
      const matchesArea = searchArea
        ? job.city?.toLowerCase().includes(searchArea.toLowerCase()) ||
          job.state?.toLowerCase().includes(searchArea.toLowerCase()) ||
          (resolvedState != null &&
            job.state?.toLowerCase().includes(resolvedState.toLowerCase()))
        : true
      return matchesService && matchesArea
    })
    .sort((a, b) => {
      const dateA = new Date(a.postedAt ?? a.createdAt).getTime()
      const dateB = new Date(b.postedAt ?? b.createdAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  // Mobile: 1 card per slide — Desktop: 4 cards (2×2 grid) per slide
  const pages = chunkArray(filteredJobs, isMobile ? 1 : 4)

  return (
    <section className="jobs-section">
      <div className="jobs-section-content">
        <h2 className="jobs-section-title">Explore our current open roles</h2>

        {error ? (
          <div className="jobs-error">
            <h2 className="jobs-empty-title">Error Loading Jobs</h2>
            <p className="jobs-empty-text">
              There was an error loading job postings. Please try again later.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C1628]"></div>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="jobs-filter-bar">
              <span className="jobs-filter-count">
                <strong>{filteredJobs.length}</strong> Available Job{filteredJobs.length !== 1 ? 's' : ''}
              </span>

              <div className="jobs-filter-controls">
                {/* Service dropdown */}
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="jobs-filter-select"
                >
                  <option value="">All Services</option>
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Area search */}
                <div className="jobs-filter-search-wrapper">
                  <span className="jobs-filter-search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                    placeholder="Search by area..."
                    className="jobs-filter-search"
                  />
                </div>

                {/* Sort order */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="jobs-filter-select"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {/* Jobs or empty state */}
            {filteredJobs.length === 0 ? (
              <div className="jobs-empty">
                <h2 className="jobs-empty-title">No Jobs Found</h2>
                <p className="jobs-empty-text">
                  No jobs found
                  {selectedService && <> for <strong>{selectedService}</strong></>}
                  {searchArea && <> in <strong>{searchArea}</strong></>}.
                </p>
              </div>
            ) : (
              <div className="jobs-slider-container">
                {/* Prev arrow */}
                <div className="jobs-swiper-button-prev">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </div>

                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    nextEl: '.jobs-swiper-button-next',
                    prevEl: '.jobs-swiper-button-prev',
                  }}
                  slidesPerView={1}
                  spaceBetween={0}
                  className="jobs-swiper"
                >
                  {pages.map((pageJobs, pageIndex) => (
                    <SwiperSlide key={pageIndex}>
                      <div className="jobs-cards-grid">
                        {pageJobs.map((job) => (
                          <JobCard key={job.id} job={job} onApply={() => setModalOpen(true)} />
                        ))}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Next arrow */}
                <div className="jobs-swiper-button-next">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Apply Now Modal */}
      {modalOpen && (
        <div className="job-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="job-modal" onClick={(e) => e.stopPropagation()}>
            <button className="job-modal-close" onClick={() => setModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="job-modal-title">Join Remonta</h2>
            <p className="job-modal-subtitle">Create an account to apply for this role.</p>
            <Link href="https://app.remontaservices.com.au/registration/worker" className="job-modal-signup-button">
              Sign Up
            </Link>
            <p className="job-modal-signin-text">
              Already a member?{' '}
              <Link href="https://app.remontaservices.com.au/login" className="job-modal-signin-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
