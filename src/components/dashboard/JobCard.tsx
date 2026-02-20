"use client";

import { useState } from "react";

interface Job {
  id: string
  zohoId: string
  recruitmentTitle: string | null
  service: string | null
  jobDescription: string | null
  city: string | null
  state: string | null
  postedAt: string | null
  createdAt: string
}

export default function JobCard({ job, onApply, applied = false }: { job: Job; onApply: () => void; applied?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const location = [job.city, job.state].filter(Boolean).join(', ') || 'Remote'

  const title =
    job.recruitmentTitle ||
    [job.service, location].filter(Boolean).join(' - ') ||
    'Support Work'

  const postedDate = new Date(
    job.postedAt ?? job.createdAt
  ).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 h-full" style={applied ? { opacity: 0.6 } : undefined}>

      {/* Header — avatar + title + location */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-blue-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">
            {title}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {location}
          </p>
        </div>
      </div>

      {/* Active badge */}
      <span className="inline-flex w-fit text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
        Active
      </span>

      {/* Posted date */}
      <p className="text-xs text-gray-500">
        <span className="font-medium text-gray-700">Posted:</span> {postedDate}
      </p>

      {/* Job Description */}
      {job.jobDescription && (
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Job Description:
          </p>
          <p className={`text-sm text-gray-600 ${expanded ? '' : 'line-clamp-4'}`}>
            {job.jobDescription}
          </p>
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="mt-1 text-xs font-medium text-teal-600 hover:text-teal-700 cursor-pointer transition-colors"
          >
            {expanded ? 'See Less' : 'See More'}
          </button>
        </div>
      )}

      {/* Apply Now / Applied */}
      <button
        onClick={applied ? undefined : onApply}
        disabled={applied}
        className={`mt-auto w-full font-semibold text-sm py-3 rounded-2xl transition-colors ${
          applied
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
        }`}
      >
        {applied ? 'Applied' : 'Apply Now'}
      </button>
    </div>
  )
}
