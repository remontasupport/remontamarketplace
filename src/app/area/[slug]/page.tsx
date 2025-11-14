'use client'
import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import HowItWorks from '@/components/sections/HowItWorks'
import '@/styles/area.css'

interface Contractor {
  id: string
  workerName: string
  suburbState: string
  image: string | null
  bio: string | null
}

interface ApiResponse {
  success: boolean
  state: string
  count: number
  contractors: Contractor[]
}

interface PageProps {
  params: {
    slug: string
  }
}

// Helper function to convert slug to state name
function slugToStateName(slug: string): string {
  return slug.toUpperCase()
}

// Worker count mapping by state
const workerCountByState: Record<string, number> = {
  'QLD': 1050,
  'VIC': 945,
  'WA': 905,
  'NSW': 859
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch contractors')
  }

  return data
}

export default function AreaPage({ params }: PageProps) {
  // How It Works data
  const howItWorksSteps = [
    {
      number: 1,
      title: 'Choose the services that meet your needs',
      description: 'Select the services you want, whether it\'s help with daily care, preparing meals, getting around the community, or other supports that make life easier.'
    },
    {
      number: 2,
      title: 'Book a support worker',
      description: 'Agree on job details with a support worker, including rates, and organise a time for the session.'
    },
    {
      number: 3,
      title: 'Manage your ongoing support',
      description: 'Live your kind of independence knowing you\'re in charge of your support with Remonta.'
    }
  ]

  // Convert slug to state name only once
  const stateName = useMemo(() => slugToStateName(params.slug), [params.slug])

  // Build API URL
  const apiUrl = `/api/contractors-by-area?state=${encodeURIComponent(stateName)}`

  // Use SWR with caching and revalidation strategy
  const { data, error, isLoading } = useSWR<ApiResponse>(apiUrl, fetcher, {
    dedupingInterval: 300000, // Cache for 5 minutes (300,000 ms)
    revalidateOnFocus: true, // Revalidate when user focuses the window
    revalidateOnReconnect: true, // Revalidate when user reconnects
    refreshInterval: 0, // Don't auto-refresh (only manual revalidation)
  })

  const contractors = data?.contractors || []
  const state = data?.state || stateName
  const workerCount = workerCountByState[stateName] || 800

  return (
    <section className="area-page">
      <div className="area-container">
        {/* Header */}
        <div className="area-header">
          <h1 className="area-title">
            {workerCount} local support workers in {state}
          </h1>
          <p className="area-description">
            Here's a preview of just some of the 800+ talented workers you can find and book on Remonta in {state}.
          </p>
        </div>

        {/* Error State */}
        {error ? (
          <div className="area-empty">
            <h2 className="area-empty-title">Error Loading Workers</h2>
            <p className="area-empty-text">
              There was an error loading workers for this area. Please try again later.
            </p>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="area-loading">
            <div className="area-spinner"></div>
          </div>
        ) : contractors.length === 0 ? (
          /* Empty State */
          <div className="area-empty">
            <h2 className="area-empty-title">No Workers Yet</h2>
            <p className="area-empty-text">No workers found in this area yet. Check back soon!</p>
          </div>
        ) : (
          /* Contractor Cards Grid */
          <div className="area-grid">
            {contractors.map((contractor) => (
              <Link key={contractor.id} href="/registration/user" className="area-card-link">
                <div className="area-card">
                  {/* Profile Picture and Name */}
                  <div className="area-card-profile">
                    <div className="area-card-image">
                      <Image
                        src={contractor.image || '/images/profilePlaceHolder.png'}
                        alt={contractor.workerName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="area-card-info">
                      <h3 className="area-card-name">
                        {contractor.workerName}
                      </h3>
                      <div className="area-card-location">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>{contractor.suburbState}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {contractor.bio && (
                    <p className="area-card-bio">
                      {contractor.bio}
                    </p>
                  )}

                  {/* Sign Up Button */}
                  <div className="area-card-button">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Sign up to view full profile
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <HowItWorks
        title="How Remonta works for people receiving support"
        subtitle="If you're a person with a disability, you have the freedom to choose who supports you and when."
        steps={howItWorksSteps}
      />
    </section>
  )
}
