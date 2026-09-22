import Image from 'next/image'
import Link from 'next/link'
import HowItWorks from '@/components/sections/HowItWorks'
import SearchBarSection from '@/components/sections/SearchBarSection'

interface Worker {
  id: string
  firstName: string
  lastName: string
  city?: string
  state?: string
  photo?: string | null
  bio?: string | null
}

interface PageProps {
  searchParams: Promise<{
    location?: string
    typeOfSupport?: string
    within?: string
  }>
}

const howItWorksSteps = [
  {
    number: 1,
    title: 'Choose the services that meet your needs',
    description: "Select the services you want, whether it's help with daily care, preparing meals, getting around the community, or other supports that make life easier."
  },
  {
    number: 2,
    title: 'Book a support worker',
    description: 'Agree on job details with a support worker, including rates, and organise a time for the session.'
  },
  {
    number: 3,
    title: 'Manage your ongoing support',
    description: "Live your kind of independence knowing you're in charge of your support with Remonta."
  }
]

async function fetchWorkers(location: string, typeOfSupport: string, within: string): Promise<Worker[]> {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (typeOfSupport) params.set('typeOfSupport', typeOfSupport)
  if (within) params.set('within', within)
  params.set('page', '1')

  try {
    const res = await fetch(`${process.env.REMONTA_API_URL}/api/public/workers?${params}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    const all: Worker[] = Array.isArray(data) ? data : (data?.data ?? data?.workers ?? data?.results ?? [])
    return all.filter((w) => w.bio && w.bio.trim().length > 0)
  } catch {
    return []
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { location = '', typeOfSupport = '', within = '20' } = await searchParams

  const workers = await fetchWorkers(location, typeOfSupport, within)

  const title = location
    ? `Support workers near ${location}`
    : 'Support workers in your area'

  return (
    <>
      <section className="bg-[#EDEFF3] py-16 px-4 sm:px-6 lg:px-8 xl:py-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12 xl:mb-16">
            <h1 className="font-cooper text-3xl sm:text-4xl md:text-5xl font-normal text-[#0C1628] mb-6">
              {title}
            </h1>
            <a
              href="https://app.remontaservices.com.au/registration/clients"
              className="inline-block bg-[#0C1628] hover:opacity-90 text-white font-medium py-3 px-8 rounded-full transition-opacity duration-200"
            >
              Sign up to connect workers near you
            </a>
          </div>

          {/* Results */}
          {workers.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="font-cooper text-2xl text-[#0C1628] mb-4">No Workers Found</h2>
              <p className="text-lg text-gray-500">Try adjusting your search filters or expanding the distance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {workers.map((worker) => {
                const displayName = `${worker.firstName} ${worker.lastName.charAt(0)}.`
                const displayLocation = [worker.city, worker.state].filter(Boolean).join(', ')

                return (
                  <Link
                    key={worker.id}
                    href="https://app.remontaservices.com.au/registration/clients"
                    className="block group"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg p-6 lg:p-8 flex flex-col h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">

                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={worker.photo || '/images/profilePlaceHolder.png'}
                            alt={displayName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-cooper text-xl font-bold text-[#0C1628] mb-1">{displayName}</h3>
                          {displayLocation && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm">{displayLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {worker.bio && (
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 flex-grow mb-4">
                          {worker.bio}
                        </p>
                      )}

                      <div className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 mt-auto group-hover:bg-gray-200 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Sign up to view full profile
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <SearchBarSection currentLocation={location} />

      <HowItWorks
        title="How Remonta works for people receiving support"
        subtitle="If you're a person with a disability, you have the freedom to choose who supports you and when."
        steps={howItWorksSteps}
      />
    </>
  )
}
