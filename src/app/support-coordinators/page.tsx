'use client'

import Image from 'next/image'
import Link from 'next/link'
import Footer from "@/components/ui/layout/Footer"
import { BRAND_COLORS } from '@/lib/constants'


export default function SupportCoordinatorsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20  lg:py-18">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <h1 style={{ color: BRAND_COLORS.PRIMARY }} className="font-cooper text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-6">
                <span className="bg-[#F8E8D8] px-2 py-1 rounded-lg inline-block leading-tight">Trusted. Ethical. Reliable.</span>
                <span className="block mt-1">Partner With a Provider Who Cares as Much as You Do.</span>
              </h1>

              <p style={{ color: BRAND_COLORS.PRIMARY }} className="font-poppins text-base sm:text-lg md:text-xl leading-relaxed mb-4">
                We work hand-in-hand with Support Coordinators across Australia to ensure participants receive consistent, high-quality care.
              </p>

              <p style={{ color: BRAND_COLORS.PRIMARY }} className="font-poppins text-base sm:text-lg md:text-xl leading-relaxed mb-8">
                Join our trusted network of partners today.
              </p>

              <Link
                href="/registration/support-coordinator"
                style={{ background: BRAND_COLORS.PRIMARY }}
                className="inline-flex items-center justify-center text-white rounded-full px-6 py-2.5 sm:px-8 sm:py-3 font-poppins font-medium text-sm sm:text-base hover:bg-[#F8E8D8] hover:text-[#0C1628] transition-colors duration-300"
              >
                Join Our Support Coordinator Network
              </Link>
            </div>

            {/* Right Image */}
            <div className="order-1 lg:order-2">
              <div className="relative w-full aspect-[3/3] lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/supportCoordinator.webp"
                  alt="Support Coordinator Care"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner With Us Section */}
      <section className="bg-white pt-0 pb-12 sm:py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="font-cooper text-2xl sm:text-2xl md:text-5xl lg:text-5xl font-normal mb-6 sm:mb-8" style={{ color: BRAND_COLORS.PRIMARY }}>
              A Partnership Built on Trust
            </h2>
            <p className="font-poppins text-sm sm:text-md lg:text-xl max-w-4xl mx-auto" style={{ color: BRAND_COLORS.PRIMARY }}>
               At Remonta, we know how important it is for Support Coordinators to connect participants with the right provider — one that's compliant, communicative, and genuinely cares.
 That's why we make collaboration simple, transparent, and fast.

            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div style={{background: BRAND_COLORS.HIGHLIGHT}} className=" rounded-2xl p-6 sm:p-8 flex flex-col hover:shadow-xl transition-all duration-300">
              <div className="flex justify-start mb-6">
                <div className="w-16 h-16 bg-[#F8E8D8] rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" style={{ color: BRAND_COLORS.PRIMARY }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
              <h3 style={{color: BRAND_COLORS.PRIMARY}} className="font-cooper text-xl sm:text-3xl lg:text-3xl text-white mb-1 sm:mb-4 min-h-[2rem] lg:min-h-[5rem]">
                Comprehensive Services
              </h3>
              <div style={{backgroundColor: BRAND_COLORS.PRIMARY, opacity: 0.2}} className="w-full h-px mb-4"></div>
              <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-sm sm:text-base text-white/80 leading-relaxed mb-6">
                From support work to cleaning, yard maintenance, and allied health.
              </p>
              <div className="relative w-[calc(100%+48px)] sm:w-full h-48 overflow-hidden mt-auto -mx-6 -mb-6 sm:mx-0 sm:mb-0 rounded-b-2xl sm:rounded-xl">
                <Image
                  src="/images/comprehensiveServices.png"
                  alt="Comprehensive Services"
                  fill
                  className="object-cover sm:rounded-xl"
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{background: BRAND_COLORS.HIGHLIGHT}} className=" rounded-2xl p-6 sm:p-8 flex flex-col hover:shadow-xl transition-all duration-300">
              <div className="flex justify-start mb-6">
                <div className="w-16 h-16 bg-[#F8E8D8] rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" style={{ color: BRAND_COLORS.PRIMARY }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                </div>
              </div>
              <h3 style={{color: BRAND_COLORS.PRIMARY}} className="font-cooper text-xl sm:text-3xl lg:text-3xl font-normal mb-1 sm:mb-4 min-h-[2rem] lg:min-h-[5rem]">
                NDIS-Compliant & Audited
              </h3>
              <div style={{backgroundColor: BRAND_COLORS.PRIMARY, opacity: 0.2}} className="w-full h-px mb-4"></div>
              <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-sm sm:text-base leading-relaxed mb-6">
                We're a registered NDIS provider, fully compliant with all national standards.
              </p>
              <div className="relative w-[calc(100%+48px)] sm:w-full h-48 overflow-hidden mt-auto -mx-6 -mb-6 sm:mx-0 sm:mb-0 rounded-b-2xl sm:rounded-xl">
                <Image
                  src="/images/ndisCompliant.png"
                  alt="NDIS Compliant & Audited"
                  fill
                  className="object-cover sm:rounded-xl"
                />
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{background: BRAND_COLORS.HIGHLIGHT}} className="rounded-2xl p-6 sm:p-8 flex flex-col hover:shadow-xl transition-all duration-300">
              <div className="flex justify-start mb-6">
                <div className="w-16 h-16 bg-[#F8E8D8] rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" style={{ color: BRAND_COLORS.PRIMARY }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
              </div>
              <h3 style={{color: BRAND_COLORS.PRIMARY}} className="font-cooper text-xl lg:text-3xl sm:text-3xl font-normal sm:mb-4 min-h-[2rem] lg:min-h-[5rem]">
                Clear Communication
              </h3>
              <div style={{backgroundColor: BRAND_COLORS.PRIMARY, opacity: 0.2}} className="w-full h-px mb-4"></div>
              <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-sm sm:text-base leading-relaxed mb-6">
                Real-time updates, progress notes, and after-care feedback ensure every participant is supported properly.
              </p>
              <div className="relative w-[calc(100%+48px)] sm:w-full h-48 overflow-hidden mt-auto -mx-6 -mb-6 sm:mx-0 sm:mb-0 rounded-b-2xl sm:rounded-xl">
                <Image
                  src="/images/clearCommunication.png"
                  alt="Clear Communication"
                  fill
                  className="object-cover sm:rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section style={{background: BRAND_COLORS.HIGHLIGHT}} className="relative overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Mobile - Header */}
          <div className="lg:hidden py-8 px-4 sm:px-1 order-1" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
            <h2 className="text-2xl md:text-4xl font-cooper text-center" style={{ color: BRAND_COLORS.PRIMARY }}>
              4,500+ Participants And Growing
            </h2>
          </div>

          {/* Left - Australia Map */}
          <div className="relative h-[300px] lg:h-[600px] order-2 lg:order-1 mx-3 lg:mx-0 my-0 lg:my-0 rounded-2xl lg:rounded-none overflow-hidden">
            <Image
              src="/images/australianMap.png"
              alt="Australia Map - Nationwide NDIS Support"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Right - Text Content with Highlight Background */}
          <div className="py-8 lg:py-24 px-4 sm:px-6 lg:px-8 flex items-center order-3 lg:order-2" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
            <div className="w-full max-w-7xl mx-auto">
              <div className="max-w-xl">
                <h2 className="hidden lg:block text-2xl md:text-4xl lg:text-5xl mb-0 lg:mb-6 font-cooper" style={{ color: BRAND_COLORS.PRIMARY }}>
                  4,000+ Participants And Growing
                </h2>
                <p className="text-sm md:text-lg mb-4 font-poppins leading-relaxed" style={{ color: BRAND_COLORS.PRIMARY }}>
                  We currently support thousands of participants across Australia.
 Our team collaborates with Support Coordinators nationwide to deliver consistent, quality care through a reliable contractor and worker network.
You'll always know where we operate and which services are available in your participant's region.

                </p>
                <p className="text-sm md:text-lg mb-0 font-poppins leading-relaxed" style={{ color: BRAND_COLORS.PRIMARY }}>
                  You'll always know where we operate and which services are available in your participant's region.

                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating States Bar - Overlaying both sections */}
        <div className="hidden lg:block absolute left-199 top-135 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-4 z-20">
          <div className="rounded-3xl shadow-2xl px-6 py-4 lg:px-8 lg:py-5 flex flex-wrap items-center justify-center gap-3 lg:gap-4" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
            {/* Servicing Label */}
            <div className="text-center">
              <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-sm lg:text-base font-bold">Servicing:</p>
            </div>

            {/* States */}
            {['NSW', 'VIC', 'QLD', 'SA', 'WA', 'ACT', 'TAS', 'NT'].map((state, index) => (
              <div key={state} className="flex items-center gap-3 lg:gap-4">
                <div className="text-center">
                  <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-sm lg:text-base">{state}</p>
                </div>
                {index < 7 && (
                  <div className="hidden lg:block w-px h-6" style={{ backgroundColor: BRAND_COLORS.PRIMARY, opacity: 0.2 }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0C1628] rounded-2xl sm:rounded-3xl px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20 text-center">
            <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal leading-tight text-white mb-6 sm:mb-8">
              Let's Work Together
            </h2>

            <p className="font-poppins text-base sm:text-lg lg:text-xl text-white leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto">
              We're always looking to expand our trusted network of Support Coordinators. By joining, you'll gain direct access to updates on participant availability, new services, and a priority connection system for referrals.
            </p>

            <Link
              href="/registration/support-coordinator"
              className="inline-flex items-center justify-center rounded-full bg-[#B1C3CD] px-8 sm:px-10 lg:px-12 py-3 sm:py-3.5 lg:py-4 font-poppins font-semibold text-base sm:text-lg text-[#0C1628] hover:bg-white transition-colors duration-200"
            >
              Join the Network
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-white py-5 pb-9 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-16">
            <h2 className="font-cooper text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-normal mb-6 sm:mb-8" style={{ color: BRAND_COLORS.PRIMARY }}>
              Quick Registration — Takes Less Than a Minute
            </h2>
            <p className="font-poppins text-sm sm:text-lg lg:text-xl max-w-4xl mx-auto leading-relaxed" style={{ color: BRAND_COLORS.PRIMARY }}>
              This helps us match participants to you accurately and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left - Image */}
            <div className="relative">
              <div className="relative h-[300px] sm:h-[585px] rounded-3xl overflow-hidden">
                <Image
                  src="/images/quickRegistration.webp"
                  alt="Support Coordinator Professional"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right - Statistics Cards */}
            <div className="space-y-4 sm:space-y-6">
              {/* Stat 1 */}
              <div className="bg-gray-100 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
                    <h3 className="font-cooper text-3xl sm:text-4xl" style={{ color: BRAND_COLORS.PRIMARY }}>
                      1
                    </h3>
                  </div>
                  <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-base sm:text-lg">
                    NDIS Registration Status
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-gray-100 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
                    <h3 className="font-cooper text-3xl sm:text-4xl" style={{ color: BRAND_COLORS.PRIMARY }}>
                      2
                    </h3>
                  </div>
                  <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-base sm:text-lg">
                    Participant Types You Support
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-gray-100 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
                    <h3 className="font-cooper text-3xl sm:text-4xl" style={{ color: BRAND_COLORS.PRIMARY }}>
                      3
                    </h3>
                  </div>
                  <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-base sm:text-lg">
                    Areas / Regions You Cover
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-gray-100 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
                    <h3 className="font-cooper text-3xl sm:text-4xl" style={{ color: BRAND_COLORS.PRIMARY }}>
                      4
                    </h3>
                  </div>
                  <p style={{color: BRAND_COLORS.PRIMARY}} className="font-poppins text-base sm:text-lg">
                    Languages Spoken
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section with Image */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left - Content */}
            <div className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
              <div className="max-w-xl text-center lg:text-left mx-auto lg:mx-0">
                <h2 className="font-cooper text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-normal mb-6" style={{ color: BRAND_COLORS.PRIMARY }}>
                  Have Questions?
                </h2>

                <p className="font-poppins text-base sm:text-lg lg:text-xl leading-relaxed mb-8" style={{ color: BRAND_COLORS.PRIMARY }}>
                  Our team is happy to discuss referrals or partnership opportunities.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                  <a href="tel:1300134153" className="flex items-center gap-2 font-poppins text-base sm:text-lg hover:opacity-80 transition-opacity" style={{ color: BRAND_COLORS.PRIMARY }}>
                    <span>📞</span>
                    <span>1300 134 153</span>
                  </a>
                  <a href="mailto:contact@remontaservices.com.au" className="flex items-center gap-2 font-poppins text-base sm:text-lg hover:opacity-80 transition-opacity" style={{ color: BRAND_COLORS.PRIMARY }}>
                    <span>✉️</span>
                    <span>contact@remontaservices.com.au</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right - Image */}
            <div className="relative h-[400px] lg:h-[800px]">
              <Image
                src="/images/haveQuestions.webp"
                alt="Support Coordinator Professional"
                fill
                className="object-cover"
                style={{ objectFit: 'cover', objectPosition: 'right 0%' }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
