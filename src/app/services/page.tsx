'use client'


import Footer from "@/components/ui/layout/Footer"
import Services from "@/app/landing/Services"
import { BRAND_COLORS } from "@/lib/constants"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Users, CheckCircle } from 'lucide-react'

export default function ServicesPage() {

  return (
    <div className="min-h-screen bg-white">
  

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/servicesHero-bg.png"
            alt="Services background"
            fill
            className="object-cover object-right"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/70 via-50% to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 font-cooper leading-tight" style={{ color: BRAND_COLORS.PRIMARY }}>
                A Full Range of Supports, No Matter How Complex
              </h1>

              <p className="text-lg md:text-xl text-gray-700 mb-8 font-poppins leading-relaxed">
                We provide a range of in-home, community, and lifestyle supports for people with disabilities and older Australians, from everyday tasks to more complex care, all with workers employed by Remonta.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/registration/client"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-white font-poppins font-medium text-base transition-colors duration-300"
                  style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = BRAND_COLORS.SECONDARY}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY}
                >
                  <Calendar className="w-5 h-5 sm:inline hidden" />
                  Provide Support
                </Link>
                <button
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 border-2 font-poppins font-medium text-base transition-colors duration-300"
                  style={{ borderColor: BRAND_COLORS.PRIMARY, color: BRAND_COLORS.PRIMARY }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = BRAND_COLORS.PRIMARY;
                  }}
                >
                  View our services
                </button>
              </div>

              {/* NDIS Logo and Text */}
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Image
                  src="/logo/ndisLogo.svg"
                  alt="NDIS Logo"
                  width={60}
                  height={60}
                  className="w-12 h-12 md:w-14 md:h-14"
                />
                <div>
                  <p className="text-sm md:text-base font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                    Registered
                  </p>
                  <p className="text-sm md:text-base font-poppins">
                    NDIS provider
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - empty for background image */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative overflow-hidden py-12 lg:py-16" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Stat 1 */}
            <div className="text-center relative">
              <h3 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                25M+
              </h3>
              <p className="text-lg md:text-xl font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                Care hours delivered
              </p>
              {/* Vertical divider - hidden on mobile, visible on md+ */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-24" style={{ backgroundColor: BRAND_COLORS.PRIMARY }}></div>
            </div>

            {/* Stat 2 */}
            <div className="text-center relative">
              <h3 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                28k+
              </h3>
              <p className="text-lg md:text-xl text-white font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                Active NDIS and Aged Care clients
              </p>
              {/* Vertical divider - hidden on mobile, visible on md+ */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-24" style={{ backgroundColor: BRAND_COLORS.PRIMARY }}></div>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <h3 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                21k+
              </h3>
              <p className="text-lg md:text-xl text-white font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                Active support workers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Map Section */}
      <section className="bg-gray-50 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div>
        
              <h2 className="font-cooper text-2xl sm:text-4xl md:text-5xl font-normal leading-tight mb-6" style={{ color: BRAND_COLORS.PRIMARY }}>
                Providing the Same Quality Care, Wherever You Are in Australia
              </h2>
              <p className="text-base sm:text-lg mb-8 font-poppins">
                We’re committed to providing consistent, compassionate care wherever you are in Australia. No matter the location, our team ensures every individual receives the same level of dedicated support and professionalism.
              </p>

            </div>

            {/* Right - Map (Enlarged) */}
            <div className="relative lg:scale-125 lg:translate-x-12 mt-15">
              <img
                src="/images/australia.svg"
                alt="Service area map"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <Services />

      {/* NDIS Help Section */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left - Text Content with Highlight Background */}
          <div className="py-16 lg:py-24 flex items-center" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
            <div className="w-full pl-6 sm:pl-6 lg:pl-[calc((100vw-1280px)/2+32px)]">
              <div className="max-w-xl pr-6 lg:pr-0">
              <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6 font-cooper" style={{ color: BRAND_COLORS.PRIMARY }}>
                Need help with specialised supports?
              </h2>
              <p className="text-base md:text-lg mb-4 font-poppins leading-relaxed" style={{ color: BRAND_COLORS.PRIMARY }}>
                If you require specialised and high-intensity supports, our team is here to help—from finding and booking the right workers to managing your team.
              </p>
              <p className="text-base md:text-lg mb-8 font-poppins leading-relaxed" style={{ color: BRAND_COLORS.PRIMARY }}>
                Get in touch to discuss your specific needs.
              </p>
              <Link
                href="/registration/client"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full px-8 py-3 border-2 font-poppins font-medium text-base transition-colors duration-300"
                style={{
                  borderColor: BRAND_COLORS.PRIMARY,
                  color: BRAND_COLORS.PRIMARY,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BRAND_COLORS.PRIMARY;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = BRAND_COLORS.PRIMARY;
                }}
              >
                Get in Touch
              </Link>
              </div>
            </div>
          </div>

          {/* Right - Image */}
          <div className="relative h-[400px] lg:h-auto">
            <Image
              src="/images/specializeCare.png"
              alt="Support worker helping NDIS participant"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
     
      <Footer />
    </div>
  )
}
