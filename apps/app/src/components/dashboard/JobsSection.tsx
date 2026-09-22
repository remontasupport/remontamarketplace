"use client";

import { useState, useEffect } from "react";
import JobCard from "./JobCard";
import Loader from "@/components/ui/Loader";

interface Job {
  id: string
  zohoId: string
  recruitmentTitle: string | null
  service: string | null
  description: string | null
  city: string | null
  state: string | null
  postedAt: string | null
  createdAt: string
}

interface JobsSectionProps {
  jobs: Job[]
  isLoading?: boolean
}

const CARDS_PER_PAGE = 3

export default function JobsSection({ jobs, isLoading = false }: JobsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <Loader size="lg" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No job listings available at the moment.</p>
      </div>
    )
  }

  const showNavigation = jobs.length > CARDS_PER_PAGE && !isMobile
  const visibleJobs = isMobile ? jobs : jobs.slice(currentIndex, currentIndex + CARDS_PER_PAGE)

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const next = prev - CARDS_PER_PAGE
      return next < 0 ? Math.max(0, jobs.length - CARDS_PER_PAGE) : next
    })
  }

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + CARDS_PER_PAGE
      return next >= jobs.length ? 0 : next
    })
  }

  return (
    <div className="news-slider-wrapper">
      <div className="section-header-main">
        <h3 className="section-title-main">Available Jobs</h3>
        {showNavigation && (
          <div className="section-nav-btns">
            <button
              className="nav-arrow-btn"
              onClick={handlePrevious}
              aria-label="Previous jobs"
            >
              ←
            </button>
            <button
              className="nav-arrow-btn"
              onClick={handleNext}
              aria-label="Next jobs"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className={isMobile ? "course-cards-grid news-swipeable" : "course-cards-grid"}>
        {visibleJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
