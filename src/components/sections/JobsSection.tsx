'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Users, MapPin } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Grid } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/grid'

// Job type from database
type Job = {
  id: string
  zohoId: string
  dealName: string
  title: string | null
  description: string | null
  stage: string
  suburbs: string | null
  state: string | null
  serviceAvailed: string | null
  serviceRequirements: string | null
  disabilities: string | null
  behaviouralConcerns: string | null
  culturalConsiderations: string | null
  language: string | null
  religion: string | null
  age: string | null
  gender: string | null
  hobbies: string | null
  postedAt: string | null
  active: boolean
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

export default function JobsSection() {
  // Use SWR with caching and revalidation strategy
  const { data: jobs, error, isLoading } = useSWR<Job[]>('/api/jobs', fetcher, {
    dedupingInterval: 300000, // Cache for 5 minutes (300,000 ms)
    revalidateOnFocus: true, // Revalidate when user focuses the window
    revalidateOnReconnect: true, // Revalidate when user reconnects
    refreshInterval: 0, // Don't auto-refresh (only manual revalidation)
  })

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
        ) : !jobs || jobs.length === 0 ? (
          <div className="jobs-empty">
            <h2 className="jobs-empty-title">No Active Jobs</h2>
            <p className="jobs-empty-text">
              There are currently no active job postings. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="jobs-slider-container">
            <Swiper
              modules={[Navigation, Grid]}
              navigation={{
                nextEl: '.jobs-swiper-button-next',
                prevEl: '.jobs-swiper-button-prev',
              }}
              grid={{
                rows: 2,
                fill: 'row'
              }}
              slidesPerView={2}
              spaceBetween={30}
              className="jobs-swiper"
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  grid: {
                    rows: 1,
                    fill: 'row'
                  },
                  spaceBetween: 20
                },
                768: {
                  slidesPerView: 2,
                  grid: {
                    rows: 2,
                    fill: 'row'
                  },
                  spaceBetween: 30
                }
              }}
            >
              {jobs.map((job) => {
                // Format location
                const location = [job.suburbs, job.state].filter(Boolean).join(', ') || 'Remote'

                // Format posted date
                const postedDate = job.postedAt
                  ? new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                return (
                  <SwiperSlide key={job.id}>
                    <div className="job-card">
                      <div className="job-card-header">
                        <div className="job-card-logo">
                          <Users size={24} />
                        </div>

                        <div className="job-card-info">
                          <div className="job-card-title-row">
                            <div>
                              <h3 className="job-card-title">
                                {job.serviceAvailed || 'Support Work'} - {location}
                              </h3>
                            </div>
                          </div>

                          <div className="job-card-location">
                            <MapPin size={20} />
                            <span>{location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="job-card-badges">
                        {job.active && (
                          <span className="job-badge job-badge-active">Active</span>
                        )}
                      </div>

                      <div className="job-card-meta">
                        <div className="job-card-meta-item">
                          <span><span className="job-card-meta-label">Posted:</span> {postedDate}</span>
                        </div>
                      </div>

                      <div className="job-card-description-section">
                        <p className="job-card-description-label">Job Description:</p>
                        <p className="job-card-description">{job.description || 'No description available'}</p>
                      </div>

                      {job.serviceRequirements && (
                        <div className="job-card-certificates">
                          <p className="job-card-certificates-label">What They Are Looking For:</p>
                          <p className="job-card-certificates-text">
                            {job.serviceRequirements}
                          </p>
                        </div>
                      )}

                      <Link href="/registration/worker">
                        <button className="job-apply-button">Apply Now</button>
                      </Link>
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>

            {/* Custom Navigation Arrows */}
            <div className="jobs-swiper-button-prev">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </div>
            <div className="jobs-swiper-button-next">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
