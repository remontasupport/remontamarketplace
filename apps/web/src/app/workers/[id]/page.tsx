'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Footer from '@/components/ui/layout/Footer'
import { BRAND_COLORS } from '@/lib/constants'

interface Contractor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  profilePicture: string | null
  title: string | null
  companyName: string | null
  yearsOfExperience: number | null
  skills: string[]
  specializations: string[]
  city: string | null
  state: string | null
  postcode: string | null
  profileTitle: string | null
  qualificationsAndCerts: string | null
  servicesOffered: string[]
  languageSpoken: string | null
  hasVehicleAccess: boolean | null
  aboutYou: string | null
  funFact: string | null
  hobbiesAndInterests: string | null
  businessUnique: string | null
  whyEnjoyWork: string | null
}

export default function WorkerProfile() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleBackClick = () => {
    sessionStorage.setItem('scrollToCarousel', 'true')
    router.push('/search-workers')
  }

  useEffect(() => {
    async function fetchContractor() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/contractors/${id}`)
        const data = await response.json()

        if (data.contractor) {
          setContractor(data.contractor)
        }
      } catch (error) {
        console.error('Error fetching contractor:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchContractor()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C1628]"></div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-cooper text-[#0C1628] mb-4">Worker not found</h2>
          <a href="/" className="text-[#0C1628] hover:underline font-poppins">
            Return to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 mb-6 text-[#0C1628] hover:text-[#1a2740] font-poppins transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Workers</span>
        </button>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Profile Image */}
          <div className="relative h-96 lg:h-[600px] rounded-3xl overflow-hidden bg-gray-100">
            {contractor.profilePicture ? (
              <Image
                src={contractor.profilePicture}
                alt={`${contractor.firstName} ${contractor.lastName}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <Image
                src="/images/profilePlaceHolder.png"
                alt={`${contractor.firstName} ${contractor.lastName}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
          </div>

          {/* Profile Info and Additional Sections */}
          <div className="flex flex-col space-y-6">
            <h1 className="text-4xl lg:text-5xl font-cooper font-bold text-[#0C1628]">
              {contractor.firstName} {contractor.lastName.charAt(0)}.
            </h1>

            {contractor.profileTitle && (
              <p className="text-xl text-gray-700 font-poppins">
                {contractor.profileTitle}
              </p>
            )}

            {contractor.qualificationsAndCerts && (
              <p className="text-base text-gray-600 font-poppins leading-relaxed">
                {contractor.qualificationsAndCerts}
              </p>
            )}

            {/* Services Offered */}
            {contractor.servicesOffered && contractor.servicesOffered.length > 0 && (
              <div>
                <h2 className="text-xl font-cooper font-bold text-[#0C1628] mb-3">Services Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {contractor.servicesOffered.map((service, index) => (
                    <span key={index} className="px-4 py-2 border border-[#0C1628] rounded-full text-sm font-poppins">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {contractor.city && contractor.state && (
                <p className="flex items-center gap-2 text-base text-gray-700 font-poppins">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {contractor.city}, {contractor.state}
                </p>
              )}
              {contractor.languageSpoken && (
                <p className="flex items-center gap-2 text-base text-gray-700 font-poppins">
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  {contractor.languageSpoken}
                </p>
              )}
              {contractor.hasVehicleAccess && (
                <p className="flex items-center gap-2 text-base text-gray-700 font-poppins">
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                  Has vehicle access
                </p>
              )}
            </div>

            {/* Additional Information Sections */}
            <div className="space-y-0 mt-0">
          {contractor.aboutYou && (
            <details className="group border-b border-gray-200" open>
              <summary className="flex items-center gap-4 py-4 cursor-pointer list-none">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0C1628] transition-transform group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0C1628] font-poppins">About</h3>
              </summary>
              <div className="pb-4 pl-14">
                <p className="text-base text-gray-600 font-poppins leading-relaxed">
                  {contractor.aboutYou}
                </p>
              </div>
            </details>
          )}

          {contractor.whyEnjoyWork && (
            <details className="group border-b border-gray-200">
              <summary className="flex items-center gap-4 py-4 cursor-pointer list-none">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0C1628] transition-transform group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0C1628] font-poppins">Why I Enjoy My Work</h3>
              </summary>
              <div className="pb-4 pl-14">
                <p className="text-base text-gray-600 font-poppins leading-relaxed">
                  {contractor.whyEnjoyWork}
                </p>
              </div>
            </details>
          )}

          {contractor.funFact && (
            <details className="group border-b border-gray-200">
              <summary className="flex items-center gap-4 py-4 cursor-pointer list-none">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0C1628] transition-transform group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0C1628] font-poppins">Fun Fact</h3>
              </summary>
              <div className="pb-4 pl-14">
                <p className="text-base text-gray-600 font-poppins leading-relaxed">
                  {contractor.funFact}
                </p>
              </div>
            </details>
          )}

          {contractor.hobbiesAndInterests && (
            <details className="group border-b border-gray-200">
              <summary className="flex items-center gap-4 py-4 cursor-pointer list-none">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0C1628] transition-transform group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0C1628] font-poppins">Hobbies & Interests</h3>
              </summary>
              <div className="pb-4 pl-14">
                <p className="text-base text-gray-600 font-poppins leading-relaxed">
                  {contractor.hobbiesAndInterests}
                </p>
              </div>
            </details>
          )}

          {contractor.businessUnique && (
            <details className="group border-b border-gray-200">
              <summary className="flex items-center gap-4 py-4 cursor-pointer list-none">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0C1628] transition-transform group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0C1628] font-poppins">What Makes Me Unique</h3>
              </summary>
              <div className="pb-4 pl-14">
                <p className="text-base text-gray-600 font-poppins leading-relaxed">
                  {contractor.businessUnique}
                </p>
              </div>
            </details>
          )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 mb-8 rounded-3xl overflow-hidden" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Content */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h2 className="font-cooper text-3xl lg:text-4xl font-normal mb-4" style={{ color: BRAND_COLORS.PRIMARY }}>
                Ready to join the growing Remonta community?
              </h2>
              <p className="text-lg mb-6" style={{ color: BRAND_COLORS.PRIMARY }}>
                Begin your journey today.
              </p>
              <div>
                <a
                  href="/registration/worker"
                  className="inline-block font-poppins font-semibold py-3 px-8 rounded-full transition-colors duration-200 text-white"
                  style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a2740'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY}
                >
                  Get started
                </a>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-80 lg:h-auto min-h-[400px]">
              <Image
                src="/images/get-started.jpg"
                alt="Join the Mable community"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
