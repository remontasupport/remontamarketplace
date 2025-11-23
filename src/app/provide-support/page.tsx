'use client'

import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import Footer from "@/components/ui/layout/Footer"
import { BRAND_COLORS } from "@/lib/constants"
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

export default function JobsPage() {
  // Use SWR with caching and revalidation strategy
  const { data: jobs, error, isLoading } = useSWR<Job[]>('/api/jobs', fetcher, {
    dedupingInterval: 300000, // Cache for 5 minutes (300,000 ms)
    revalidateOnFocus: true, // Revalidate when user focuses the window
    revalidateOnReconnect: true, // Revalidate when user reconnects
    refreshInterval: 0, // Don't auto-refresh (only manual revalidation)
  })

  return (
    <div className="jobs-container">
      {/* Hero Section */}
      <section className="jobs-hero-section">
        <div className="jobs-hero-container">
          <div className="jobs-hero-grid">
            {/* Left Column - Content */}
            <div className="jobs-hero-content">
              <h1 className="jobs-hero-title">
                Provide Independent <span className="jobs-hero-highlight">Support Work</span> on Remonta
              </h1>
              <p className="jobs-hero-description">
                Support workers have a real impact on people’s lives. It’s a meaningful job that comes with both purpose and responsibility. Find out what being an independent support worker could mean for you.
              </p>
              <Link href="/registration/worker" className="jobs-hero-button">
                Get Started
              </Link>
            </div>

            {/* Right Column - Image */}
            <div className="jobs-hero-image-wrapper">
              <div className="jobs-hero-image-container">
                <div className="jobs-hero-image">
                  <Image
                    src="/images/supportWorker.jpg"
                    alt="Support worker helping someone"
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    style={{ borderRadius: '2rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section - Temporarily Hidden */}
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
                            <p className="job-card-certificates-label">What We're Looking For:</p>
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

      {/* Benefits Section */}
      <section className="jobs-benefits-section">
        <div className="jobs-benefits-container">
          <div className="jobs-benefits-grid">
            {/* Left Column - Heading */}
            <div className="jobs-benefits-content">
              <h2 className="jobs-benefits-title">
                Is providing support work on Remonta right for you?
              </h2>
              <p className="jobs-benefits-description">
                Join thousands of support workers who have built successful careers helping others while enjoying the flexibility and independence they deserve.
              </p>
              <p className="jobs-benefits-cta">
                Ready to take control of your career? Start your journey with Remonta today and discover the difference independent support work can make.
              </p>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="jobs-benefits-cards">
              {/* Card 1 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Choose your own hours</h3>
                <p className="jobs-benefit-text">
                  Work when it suits you. Set your own schedule and maintain the perfect work-life balance.
                </p>
              </div>

              {/* Card 2 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Competitive Pay</h3>
                <p className="jobs-benefit-text">
                  Earn competitive rates with transparent pricing and regular payment processing.
                </p>
              </div>

              {/* Card 3 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Apply for your preferred support worker jobs</h3>
                <p className="jobs-benefit-text">
                  Browse opportunities and choose the roles that match your skills and interests.
                </p>
              </div>

              {/* Card 4 */}
              <div className="jobs-benefit-card">
                <div className="jobs-benefit-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="jobs-benefit-title">Build your own business</h3>
                <p className="jobs-benefit-text">
                  Grow your client base, set your rates, and build a sustainable support work business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="jobs-testimonial-section">
        <div className="jobs-testimonial-container">
          {/* Section Header */}
          <div className="jobs-testimonial-header">
            <h2 className="jobs-testimonial-heading">
              Support work is built on empathy, dedication, and responsibility.
            </h2>
            <p className="jobs-testimonial-subheading">
              Your role as a support worker makes a real difference in people's lives.
            </p>
          </div>

          <div className="jobs-testimonial-grid">
            {/* Left Column - Story Card */}
            <div className="jobs-testimonial-story-card">
              <div className="jobs-testimonial-image-wrapper">
                <Image
                  src="/images/workerTestimonial.jpg"
                  alt="Support worker testimonial"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={100}
                  priority
                />
              </div>
            </div>

            {/* Right Column - Testimonial Quote */}
            <div className="jobs-testimonial-quote-card">
           
              <blockquote className="jobs-testimonial-quote">
                "Working with Remonta has transformed my career. I have the freedom to choose my schedule while making a real difference in people's lives every day."
              </blockquote>
              <p className="jobs-testimonial-author">Sarah Thompson</p>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications Section */}
      <section className="jobs-qualifications-section">
        <div className="jobs-qualifications-container">
          {/* Section Header */}
          <div className="jobs-qualifications-header">
            <h2 className="jobs-qualifications-heading">
              What kind of support work can you offer on Remonta?
            </h2>
            <p className="jobs-qualifications-subheading">
              The services you can provide to clients on Remonta depend on your qualifications and experience.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="jobs-qualifications-grid">
            {/* Left Card - Qualified */}
            <div className="jobs-qualifications-card jobs-qualifications-card-qualified">
              <h3 className="jobs-qualifications-card-title">
                Are you a qualified support worker?
              </h3>

              <div className="jobs-qualifications-card-content">
                <p className="jobs-qualifications-card-subtitle">This means you are either:</p>
                <ul className="jobs-qualifications-list">
                  <li>A Registered or Enrolled Nurse</li>
                  <li>An allied health professional</li>
                  <li>A qualified personal care worker</li>
                </ul>

                <p className="jobs-qualifications-card-text">
                  In-demand services on Remonta include nursing, personal care, psychology, occupational therapy,
                  speech therapy, and physiotherapy. If you are qualified to provide any of these services and can
                  supply the necessary documentation, you may be able to find work fast on the Remonta platform.
                </p>
              </div>
            </div>

            {/* Right Card - Unqualified */}
            <div className="jobs-qualifications-card jobs-qualifications-card-unqualified">
              <h3 className="jobs-qualifications-card-title">
                Are you a support worker without any formal qualifications?
              </h3>

              <div className="jobs-qualifications-card-content">
                <p className="jobs-qualifications-card-subtitle">You can provide support for:</p>
                <ul className="jobs-qualifications-list">
                  <li>Daily living activities</li>
                  <li>Social and community activities</li>
                  <li>Housework, transportation, and meal preparation</li>
                </ul>

                <p className="jobs-qualifications-card-subtitle-secondary">
                  Enhance skills for support work job opportunities
                </p>

                <p className="jobs-qualifications-card-text">
                  Complete accredited training to increase your skills and provide additional services to your clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="jobs-cta-section">
        <div className="jobs-cta-container">
          <div className="jobs-cta-card">
            {/* Left Side - Content */}
            <div className="jobs-cta-content">
              <h2 className="jobs-cta-title">
                I'm ready to become an independent support worker on Remonta
              </h2>
              <p className="jobs-cta-description">
                If you have all your documentation ready and you understand what's required of you as a support worker on Remonta, sign up below.
              </p>
              <Link href="/registration/worker" className="jobs-cta-button">
                Get started
              </Link>
            </div>

            {/* Right Side - Image */}
            <div className="jobs-cta-image-wrapper">
              <Image
                src="/images/readyToSupport.jpg"
                alt="Support worker with client"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={100}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
