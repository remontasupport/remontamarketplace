'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Contractor {
  id: string
  workerName: string
  suburbState: string
  image: string | null
  bio: string | null
}

interface PageProps {
  params: {
    slug: string
  }
}

export default function AreaPage({ params }: PageProps) {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [area, setArea] = useState('')
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        // Convert slug back to area name (e.g., "sydney-nsw" -> "Sydney, NSW")
        const areaName = params.slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(', ')
          .replace(', Nsw', ', NSW')
          .replace(', Qld', ', QLD')
          .replace(', Vic', ', VIC')
          .replace(', Sa', ', SA')
          .replace(', Wa', ', WA')

        const response = await fetch(`/api/contractors-by-area?area=${encodeURIComponent(areaName)}`)
        const data = await response.json()

        if (data.success) {
          setContractors(data.contractors)
          setArea(data.area)
          setCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching contractors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContractors()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-[#0C1628] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cooper text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4">
            {count.toLocaleString()} local support workers near {area}
          </h1>
          <p className="font-sans text-lg text-gray-300 max-w-3xl mx-auto">
            Here's a preview of just some of the {count.toLocaleString()} talented workers you can find and book on Remonta in {area}.
          </p>
        </div>

        {/* Contractor Cards Grid */}
        {contractors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No workers found in this area yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractors.map((contractor) => (
              <div
                key={contractor.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 p-6"
              >
                {/* Profile Picture and Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={contractor.image || '/images/profilePlaceHolder.png'}
                      alt={contractor.workerName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cooper text-xl font-bold text-[#0C1628] mb-1">
                      {contractor.workerName}
                    </h3>
                    <div className="flex items-center gap-1 text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-sans">{contractor.suburbState}</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {contractor.bio && (
                  <p className="text-sm text-gray-700 font-sans leading-relaxed mb-4 line-clamp-3">
                    {contractor.bio}
                  </p>
                )}

                {/* Sign Up Button */}
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-sans">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Sign up to view full profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
