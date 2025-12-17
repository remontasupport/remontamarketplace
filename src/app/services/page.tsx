import { Metadata } from 'next'
import Footer from "@/components/ui/layout/Footer"
import Services from "@/app/landing/Services"
import { BRAND_COLORS } from "@/lib/constants"
import Image from "next/image"
import Link from "next/link"
import ScrollToServicesButton from "@/components/ui/ScrollToServicesButton"

export const metadata: Metadata = {
  title: 'NDIS Support Services Australia | Remonta Support Services',
  description: 'Comprehensive NDIS support services including personal care, cleaning, home maintenance, fitness, therapeutic support, nursing, and home modifications across Australia.',
  keywords: ['NDIS services', 'disability support', 'personal care', 'therapeutic support', 'nursing services', 'home modifications', 'NDIS provider Australia'],
  openGraph: {
    title: 'NDIS Support Services Australia | Remonta',
    description: 'Full range of in-home, community, and lifestyle supports for people with disabilities. From everyday tasks to complex care.',
    url: 'https://www.remontaservices.com.au/services',
    siteName: 'Remonta Services',
    images: [
      {
        url: '/images/servicesHero.webp',
        width: 1200,
        height: 630,
        alt: 'Remonta NDIS Support Services',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NDIS Support Services Australia | Remonta',
    description: 'Full range of in-home, community, and lifestyle supports for people with disabilities.',
    images: ['/images/servicesHero.webp'],
  },
}

export default function ServicesPage() {

  return (
    <div className="min-h-screen bg-white">
  

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-1 lg:py-18">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <h1 style={{ color: BRAND_COLORS.PRIMARY }} className="font-cooper text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-4">
                A Full Range of Supports, No Matter How Complex
              </h1>

              <p style={{ color: BRAND_COLORS.PRIMARY }} className="font-poppins text-base sm:text-lg md:text-xl leading-relaxed mb-1">
                We provide a range of in-home, community, and lifestyle supports for people with disabilities and older Australians, from everyday tasks to more complex care.
              </p>

              <p style={{ color: BRAND_COLORS.PRIMARY }} className="font-poppins text-base sm:text-lg md:text-xl leading-relaxed mb-8">
                All support provided by workers employed by Remonta.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="https://app.remontaservices.com.au/registration/worker"
                  style={{ background: BRAND_COLORS.PRIMARY }}
                  className="inline-flex items-center justify-center text-white rounded-full px-6 py-2.5 sm:px-8 sm:py-3 font-poppins font-medium text-sm sm:text-base hover:bg-[#EDEFF3] hover:text-white transition-colors duration-300"
                >
                  Provide Support
                </Link>
                <ScrollToServicesButton />
              </div>

              {/* NDIS Logo and Text */}
              <div className="hidden lg:flex items-center gap-3">
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
                  <p className="text-sm md:text-base font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                    NDIS provider
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="order-1 lg:order-2">
              <div className="relative w-full aspect-[3/3] lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/servicesHero.webp"
                  alt="Support Services"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative overflow-hidden py-12 lg:py-16" style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12" data-nosnippet>
            {/* Stat 1 */}
            <div className="text-center relative">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                25M+
              </div>
              <p className="text-lg md:text-xl font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                Care hours delivered
              </p>
              {/* Vertical divider - hidden on mobile, visible on md+ */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-24" style={{ backgroundColor: BRAND_COLORS.PRIMARY }}></div>
            </div>

            {/* Stat 2 */}
            <div className="text-center relative">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                28k+
              </div>
              <p className="text-lg md:text-xl text-white font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                Active NDIS clients
              </p>
              {/* Vertical divider - hidden on mobile, visible on md+ */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-24" style={{ backgroundColor: BRAND_COLORS.PRIMARY }}></div>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                21k+
              </div>
              <p className="text-lg md:text-xl text-white font-poppins" style={{ color: BRAND_COLORS.PRIMARY }}>
                Active support workers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Map Section */}
      <section className="bg-gray-50 py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div>

              <h2 className="font-cooper text-2xl sm:text-4xl md:text-5xl font-normal leading-tight mb-6" style={{ color: BRAND_COLORS.PRIMARY }}>
                Providing the Same Quality Care, Wherever You Are in Australia
              </h2>
              <p className="text-base sm:text-lg mb-8 font-poppins">
                We're committed to providing consistent, compassionate care wherever you are in Australia. No matter the location, our team ensures every individual receives the same level of dedicated support and professionalism.
              </p>

            </div>

            {/* Right - Map (Enlarged) */}
            <div className="relative sm:scale-100 lg:scale-125 lg:translate-x-12 lg:mt-15">
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
      <section className="jobs-cta-section">
        <div className="jobs-cta-container">
          <div className="jobs-cta-card">
            {/* Left Side - Content */}
            <div className="jobs-cta-content">
              <h2 className="jobs-cta-title">
                Need help with specialised supports?
              </h2>
              <p className="jobs-cta-description">
                If you require specialised and high-intensity supports, our team is here to help—from finding and booking the right workers to managing your team.
              </p>
              <Link href="/registration/user" className="jobs-cta-button">
                Get in Touch
              </Link>
            </div>

            {/* Right Side - Image */}
            <div className="jobs-cta-image-wrapper">
              <Image
                src="/images/specializeCare.png"
                alt="Support worker helping NDIS participant"
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
